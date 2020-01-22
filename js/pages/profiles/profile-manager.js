'use strict'
define([
  'require',
  'knockout',
  'const',
  'services/PluginRegistry',
  'text!./profile-manager.html',
  'd3',
  'utils/DatatableUtils',
  'services/Sample',
  'appConfig',
  'services/AuthAPI',
  'services/Profile',
  'atlas-state',
  'components/cohortbuilder/CohortDefinition',
  'services/CohortDefinition',
  'services/ConceptSet',
  'pages/Page',
  'utils/AutoBind',
  'utils/CommonUtils',
  'pages/Router',
  'moment',
  './const',
  'lodash',
  'crossfilter',
  'assets/ohdsi.util',
  'd3-tip',
  'databindings',
  'faceted-datatable',
  'extensions/bindings/profileChart',
  'less!./profile-manager.less',
  'components/heading',
  'components/ac-access-denied',
  './profileTimeline',
], function(
  require,
  ko,
  globalConstants,
  pluginRegistry,
  view,
  d3,
  datatableUtils,
  sampleService,
  config,
  authApi,
  profileService,
  sharedState,
  CohortDefinition,
  cohortDefinitionService,
  conceptSetService,
  Page,
  AutoBind,
  commonUtils,
  router,
  moment,
  constants,
  _,
  crossfilter,
  util
) {
  var reduceToRecs = [
    // crossfilter group reduce functions where group val
    // is an array of recs in the group
    (p, v, nf) => p.concat(v),
    (p, v, nf) => _.without(p, v),
    () => [],
  ]
  const Timeline = require('./profileTimeline')

  function gender(code) {
    if (code == 8507) return 'Male'
    if (code == 8532) return 'Female'
    else return 'Other'
  }

  class ProfileManager extends AutoBind(Page) {
    constructor(params) {
      super(params)
      this.sharedState = sharedState
      this.config = config
      this.filterHighlightsText = ko.observable()
      this.loadingStatus = ko.observable('loading')

      this.sourceKey = ko.observable(router.routerParams().sourceKey)
      this.personId = ko.observable(router.routerParams().personId)
      this.personRecords = ko.observableArray()

      this.cohortDefinitionId = ko.observable(
        router.routerParams().cohortDefinitionId
      )
      this.person = ko.observable()
      this.loadingPerson = ko.observable(false)
      this.cantFindPerson = ko.observable(false)
      // sample redirect state
      this.isLoadingSampleData = ko.observable(false)
      this.patientSelectionData = ko.observableArray([])
      this.selectedPatients = ko.observableArray([])

      this.sampleName = ko.observable()
      this.sampleId = ko.observable(router.routerParams().sampleId) // it shoule equa 'sample'
      if (this.sampleId()) {
        this.fetchSampleData({
          sampleId: this.sampleId(),
          sourceKey: this.sourceKey(),
          cohortDefinitionId: this.cohortDefinitionId(),
        })
        $('#modalPatientSelection').on('hidden.bs.modal', () => {
          // overridde selected patients to original ones if it's data not fetched
          const currentPersonId = this.personId()
          const currentSecondPersonId = this.secondPersonId()
          if (
            this.selectedPatients().includes(currentSecondPersonId) &&
            this.selectedPatients().includes(currentPersonId)
          ) {
            // nothing changes => do nothing
            return
          }

          const currentPersonIndex = this.patientSelectionData().findIndex(
            el => el.personId == currentPersonId
          )
          const currentSecondPersonIndex = this.patientSelectionData().findIndex(
            el => el.personId == currentSecondPersonId
          )

          if (this.selectedPatients().length >= 1) {
            const index = this.patientSelectionData().findIndex(
              el => el.personId == this.selectedPatients()[0]
            )
            this.patientSelectionData.replace(
              this.patientSelectionData()[index],
              {
                ...this.patientSelectionData()[index],
                selected: false,
              }
            )
          }
          if (this.selectedPatients().length == 2) {
            const index = this.patientSelectionData().findIndex(
              el => el.personId == this.selectedPatients()[1]
            )
            this.patientSelectionData.replace(
              this.patientSelectionData()[index],
              {
                ...this.patientSelectionData()[index],
                selected: false,
              }
            )
          }
          this.selectedPatients.removeAll()
          this.selectedPatients.push(currentPersonId)
          if (currentSecondPersonId) {
            this.selectedPatients.push(currentSecondPersonId)
          }
          this.patientSelectionData.replace(
            this.patientSelectionData()[currentPersonIndex],
            {
              ...this.patientSelectionData()[currentPersonIndex],
              selected: true,
            }
          )

          this.patientSelectionData.replace(
            this.patientSelectionData()[currentSecondPersonIndex],
            {
              ...this.patientSelectionData()[currentSecondPersonIndex],
              selected: true,
            }
          )
        })
      }
      this.sampleId.subscribe(val => {
        this.fetchSampleData({
          sampleId: val,
          sourceKey: this.sourceKey(),
          cohortDefinitionId: this.cohortDefinitionId(),
        })
      })
      // sample second person state
      this.showPerson2 = ko.observable(false)
      this.secondPersonId = ko.observable(router.routerParams().secondPersonId)
      this.secondPersonRecords = ko.observableArray()
      this.cantFindSecondPerson = ko.observable(false)
      this.loadingSecondPerson = ko.observable(false)
      this.secondPersonGender = ko.observable()
      this.xfObservableSecond = ko.observable()
      this.secondPersonGenderClass = ko.computed(() => {
        if (this.secondPersonGender() === 'FEMALE') {
          return 'fa fa-female'
        } else if (this.secondPersonGender() === 'MALE') {
          return 'fa fa-male'
        } else {
          return 'fa fa-question'
        }
      })
      this.secondPersonRecordCount = ko.observable()
      this.secondPersonAgeAtIndex = ko.observable()

      this.secondPersonId.subscribe(val => {
        if (val && this.sampleId()) {
          this.loadComparingPerson(val)
        }
      })
      if (this.sampleId() && this.personId()) {
        this.selectedPatients.push(this.personId())
        this.loadComparingPerson()
      }
      if (this.sampleId && this.secondPersonId()) {
        this.selectedPatients.push(this.secondPersonId())
        this.loadComparingPerson(this.secondPersonId())
      }
      this.combinedPersonIds = ko.computed(() => {
        if (!this.secondPersonId()) {
          return this.personId()
        } else {
          return `${this.personId()}; ${this.secondPersonId()}`
        }
      })

      this.currentCohortDefinition = ko.observable(null)
      this.cohortDefinition = sharedState.CohortDefinition.current
      // if a cohort definition id has been specified, see if it is
      // already loaded into the page model. If not, load it from the
      // server
      if (
        this.cohortDefinitionId() &&
        (this.cohortDefinition() &&
          this.cohortDefinition().id() === this.cohortDefinitionId)
      ) {
        // The cohort definition requested is already loaded into the page model - just reference it
        this.currentCohortDefinition(this.cohortDefinition())
      } else if (this.cohortDefinitionId()) {
        cohortDefinitionService
          .getCohortDefinition(this.cohortDefinitionId())
          .then(cohortDefinition => {
            this.currentCohortDefinition(new CohortDefinition(cohortDefinition))
          })
      }
      this.isAuthenticated = authApi.isAuthenticated
      this.permittedSources = ko.computed(() =>
        sharedState
          .sources()
          .filter(s => authApi.isPermittedViewProfiles(s.sourceKey))
      )
      this.canViewProfiles = ko.computed(() => {
        return (
          (config.userAuthenticationEnabled &&
            this.isAuthenticated() &&
            this.permittedSources().length > 0) ||
          !config.userAuthenticationEnabled
        )
      })

      this.cohortSource = ko.observable()
      this.shadedRegions = ko.observable([])

      this.setSourceKey = d => {
        this.sourceKey(d.sourceKey)
      }

      this.cohortDefSource = ko.computed(() => {
        return {
          cohortDef: this.currentCohortDefinition(),
          sourceKey: this.sourceKey(),
        }
      })
      this.cohortDefSource.subscribe(o => {
        this.loadConceptSets(o)
      })
      this.loadConceptSets = o => {
        if (!o.cohortDef) return
        var conceptSets = ko.toJS(o.cohortDef.expression().ConceptSets())
        conceptSets.forEach(conceptSet => {
          conceptSetService.resolveConceptSetExpressionSimple(
            ko.toJS(conceptSet.expression),
            _.bind(this.loadedConceptSet, this, conceptSet)
          )
        })
      }
      this.conceptSets = ko.observable({})
      this.loadedConceptSet = (conceptSet, ids, status) => {
        this.conceptSets(
          _.extend({}, this.conceptSets(), {
            [conceptSet.name]: ids,
          })
        )
      }
      this.loadConceptSets(this.cohortDefSource())

      this.sourceKeyCaption = ko.computed(() => {
        return this.sourceKey() || 'Select a Data Source'
      })
      this.personRequests = {}
      this.personRequest
      this.xfObservable = ko.observable()
      this.crossfilter = ko.observable()
      this.highlightEnabled = ko.observable(false)
      this.filteredRecs = ko.observableArray([])
      this.filtersChanged = ko.observable()
      this.facetsObs = ko.observableArray([])
      this.highlightRecs = ko.observableArray([])
      this.getGenderClass = ko.computed(() => {
        if (this.person()) {
          if (this.person().gender === 'FEMALE') {
            return 'fa fa-female'
          } else if (this.person().gender === 'MALE') {
            return 'fa fa-male'
          } else {
            return 'fa fa-question'
          }
        }
      })
      this.dateRange = ko.computed(() => {
        if (
          this.canViewProfileDates() &&
          this.xfObservable &&
          this.xfObservable() &&
          this.xfObservable().isElementFiltered()
        ) {
          const filtered = this.xfObservable().allFiltered()
          return filtered
            .map(v => ({
              startDate: moment(v.startDate)
                .add(v.startDays, 'days')
                .valueOf(),
              endDate: moment(v.endDate)
                .subtract(v.endDays, 'days')
                .valueOf(),
            }))
            .reduce((a, v) => ({
              startDate: a.startDate < v.startDate ? a.startDate : v.startDate,
              endDate: a.endDate > v.endDate ? a.endDate : v.endDate,
            }))
        }
        return {
          startDate: null,
          endDate: null,
        }
      })
      this.startDate = ko.computed(() => this.dateRange().startDate)
      this.endDate = ko.computed(() => this.dateRange().endDate)

      this.dimensions = {
        Domain: {
          caption: 'Domain',
          func: d => d.domain,
          filter: ko.observable(null),
          Members: [],
        },
        profileChart: {
          name: 'profileChart',
          func: d => [d.startDay, d.endDay],
          filter: ko.observable(null),
        },
        conceptName: {
          name: 'conceptName',
          func: d => d.conceptName,
          filter: ko.observable(null),
        },
        concepts: {
          name: 'concepts',
          isArray: true,
          func: d => {
            return _.chain(this.conceptSets())
              .map(function(ids, conceptSetName) {
                if (_.includes(ids, d.conceptId))
                  return '<i class="fa fa-shopping-cart"></i> ' + conceptSetName
              })
              .compact()
              .value()
              .concat(d.conceptName)
          },
          filter: ko.observable(null),
        },
      }
      this.searchHighlight = ko.observable()
      this.highlightData = ko.observableArray()
      this.defaultColor = '#888'
      this.words = ko.computed(() => {
        if (!this.xfObservable()) {
          return
        }
        this.dimensionSetup(this.dimensions.concepts, this.xfObservable())
        const stopWords = ['Outpatient Visit', 'No matching concept']
        let words = this.dimensions.concepts.group.all().filter(d => {
          let filtered = true
          if (
            this.filterHighlightsText() &&
            this.filterHighlightsText().length > 0
          ) {
            if (
              d.key
                .toLowerCase()
                .indexOf(this.filterHighlightsText().toLowerCase()) == -1
            ) {
              filtered = false
            }
          }
          return d.value.length && stopWords.indexOf(d.key) === -1 && filtered
        })
        words = words.map(d => {
          return {
            caption: d.key,
            domain: d.value[0].domain,
            text: d.key,
            recs: d.value,
            count: d.value.length,
            highlight: ko.observable(this.defaultColor),
          }
        })
        words = _.sortBy(words, d => -d.recs.length)
        // profile chart will render all data in case when no data is captured by filter
        if (words.length !== 0) {
          this.highlightData(words)
        }
      })

      this.searchHighlight.subscribe(func => {
        if (func) this.highlight(this.filteredRecs().filter(func))
        else this.highlight([])
      })
      this.cohortDefinitionButtonText = ko.observable(
        'Click Here to Select a Cohort'
      )

      this.showSection = {
        profileChart: ko.observable(true),
        datatable: ko.observable(true),
      }
      this.highlightDom =
        '<<"row vertical-align"<"col-xs-6"><"col-xs-6 search"f>><t><"row vertical-align"<"col-xs-6"i><"col-xs-6"p>>>'
      this.highlightColumns = [
        'select',
        {
          render: this.swatch,
          data: 'highlight()',
          sortable: false,
        },
        {
          title: 'Concept Name',
          data: 'caption',
        },
        {
          title: 'Domain',
          data: 'domain',
        },
        {
          title: 'Total Records',
          data: 'count',
        },
      ]

      this.patientSelectionColumn = [
        {
          title: '',
          sortable: false,
          data: 'selected',
          render: function(d) {
            return `<span data-bind="css: { selected: ${d}}, enable: ${d !=
              null}" class="sample-select fa fa-check"></span>`
          },
        },
        {
          title: 'Person ID',
          render: datatableUtils.getLinkFormatter(d => ({
            label: d['personId'],
            linkish: true,
          })),
        },
        {
          title: 'Gender',
          data: 'gender',
        },
        {
          title: 'Age at index',
          data: 'ageIndex',
        },
        {
          title: 'Number of events',
          data: 'eventCounts',
        },
      ]

      this.columns = [
        {
          title: 'Concept Id',
          data: 'conceptId',
        },
        {
          title: 'Concept Name',
          data: 'conceptName',
        },
        {
          title: 'Domain',
          data: 'domain',
        },
        {
          title: 'Start Day',
          data: 'startDay',
        },
        {
          title: 'End Day',
          data: 'endDay',
        },
      ]
      // d3.schemePaired
      this.palette = [
        '#a6cee3',
        '#1f78b4',
        '#b2df8a',
        '#33a02c',
        '#fb9a99',
        '#e31a1c',
        '#fdbf6f',
        '#ff7f00',
        '#cab2d6',
        '#6a3d9a',
        '#ff9',
        '#b15928',
      ]

      this.sourceKey.subscribe(sourceKey => {
        document.location = constants.paths.source(sourceKey)
      })
      this.personId.subscribe(personId => {
        if (!this.sampleId()) {
          document.location = constants.paths.person(this.sourceKey(), personId)
        }
        if (this.sampleId() && personId) {
          this.loadComparingPerson()
        }
      })

      $('.highlight-filter').on('click', function(evt) {
        return false
      })

      this.highlightOptions = {}
      this.options = {
        Facets: [
          {
            caption: 'Domain',
            binding: d => d.domain,
          },
        ],
      }

      $('#modalHighlights').draggable()
      $('#modalPatientSelection').draggable()

      if (this.personId() && !this.sampleId()) {
        this.loadPerson()
      }

      this.plugins = pluginRegistry.findByType(
        globalConstants.pluginTypes.PROFILE_WIDGET
      )
    }

    loadPerson() {
      this.cantFindPerson(false)
      this.loadingPerson(true)

      let url = constants.paths.person(this.sourceKey(), this.personId())
      this.loadingStatus('loading profile data from database')
      this.personRequest = this.personRequests[url] = profileService
        .getProfile(
          this.sourceKey(),
          this.personId(),
          this.cohortDefinitionId()
        )
        .then(person => {
          if (this.personRequest !== this.personRequests[url]) {
            return
          }
          this.loadingStatus('processing profile data')
          person.personId = this.personId()
          this.loadingPerson(false)
          let cohort
          let cohortDefinitionId = this.cohortDefinitionId()
          if (cohortDefinitionId) {
            cohort = _.find(person.cohorts, function(o) {
              return o.cohortDefinitionId == cohortDefinitionId
            })
          }
          // In the event that we could not find the matching cohort in the person object or the cohort definition id is not specified default it
          if (typeof cohort === 'undefined') {
            cohort = {
              startDate: _.chain(person.records)
                .map(d => d.startDate)
                .min()
                .value(),
            }
          }

          this.personRecords(person.records)
          this.person(person)
          if (!this.timeline1) {
            this.timeline1 = new Timeline('profileTimeline1')
            this.timeline1.updateData(person.records)
          } else {
            // get new timeline
            this.timeline1.removeInput()
            this.timeline1.updateData(person.records)
          }
        })
        .catch(err => {
          console.error(err)
          // remove if error
          if (this.timeline1) {
            this.timeline1.remove()
            this.timeline1 = null
          }
          this.cantFindPerson(true)
          this.loadingPerson(false)
        })
    }

    removeHighlight() {
      this.highlight([])
    }

    highlight(recs, evt) {
      if (recs && recs.length > 0) {
        this.highlightEnabled(true)
      } else {
        this.highlightEnabled(false)
      }
      this.highlightRecs(
        [
          {
            color: '#f00',
            recs: recs,
          },
        ] || []
      )
    }

    dimensionSetup(dim, cf) {
      if (!cf) return
      dim.dimension = cf.dimension(dim.func, dim.isArray)
      dim.filter(null)
      dim.group = dim.dimension.group()
      dim.group.reduce(...reduceToRecs)
      dim.groupAll = dim.dimension.groupAll()
      dim.groupAll.reduce(...reduceToRecs)
    }

    dispToggle(pm, evt) {
      let section = evt.target.value
      this.showSection[section](!this.showSection[section]())
    }

    swatch(d) {
      return '<div class="swatch" style="background-color:' + d + '"></div>'
    }

    setHighlights(colorIndex) {
      const dt = $('#highlight-table table').DataTable()
      const rows = dt.rows('.selected')
      var selectedData = rows.data()
      for (let i = 0; i < selectedData.length; i++) {
        //get color here
        selectedData[i].highlight(this.getHighlightBackground(colorIndex)) // set the swatch color
        selectedData[i].recs.forEach(r => {
          r.highlight = this.getHighlightBackground(colorIndex)
          r.stroke = this.getHighlightColor(colorIndex)
        }) // set the record colors
      }
      rows && rows[0] && rows[0].forEach(r => dt.row(r).invalidate())
      this.highlightRecs.valueHasMutated()
    }

    getHighlightColor(i) {
      return this.palette[i * 2]
    }

    getHighlightBackground(i) {
      return this.palette[i * 2 + 1]
    }

    clearHighlights() {
      const dt = $('#highlight-table table').DataTable()
      const rows = dt.rows('.selected')
      var selectedData = rows.data()
      for (let i = 0; i < selectedData.length; i++) {
        selectedData[i].highlight(this.defaultColor) // set the swatch color
        selectedData[i].recs.forEach(r => {
          r.highlight = this.defaultColor // set the record colors
          r.stroke = this.defaultColor // set the record colors
        })
      }
      rows && rows[0] && rows[0].forEach(r => dt.row(r).invalidate())
      this.highlightRecs.valueHasMutated()
    }

    highlightRowClick(data, evt, row) {
      evt.stopPropagation()
      $(row).toggleClass('selected')
    }

    canViewProfileDates() {
      return (
        config.viewProfileDates &&
        (!config.userAuthenticationEnabled ||
          (config.userAuthenticationEnabled &&
            authApi.isPermittedViewProfileDates()))
      )
    }

    //sample related methods
    fetchSampleData({ sampleId, sourceKey, cohortDefinitionId }) {
      this.isLoadingSampleData(true)
      sampleService
        .getSample({ cohortDefinitionId, sourceKey, sampleId })
        .then(res => {
          const transformedSampleData = res.elements.map(el => {
            let selected
            if (
              el.personId == this.personId() ||
              el.personId == this.secondPersonId()
            ) {
              selected = true
            } else {
              selected = false
            }
            return {
              personId: el.personId,
              gender: gender(el.genderConceptId),
              ageIndex: el.age,
              eventCounts: el.recordCount || '',
              selected,
            }
          })
          this.patientSelectionData(transformedSampleData)
          this.sampleName(res.name)
        })
        .catch(error => {
          console.error(error)
        })
        .finally(() => {
          this.isLoadingSampleData(false)
        })
    }
    onSampleDataClick(d) {
      //change checkbox state
      //if user does not fetch new data, these state will be overridden
      // on listening to close button (see this event handler in the constructors )
      if (this.selectedPatients().includes(d.personId)) {
        this.selectedPatients.remove(d.personId)
        this.patientSelectionData.replace(d, { ...d, selected: !d.selected })
      } else {
        if (this.selectedPatients().length == 2) {
          alert('You can only select maximum 2 patients')
          return
        }
        this.selectedPatients.push(d.personId)
        this.patientSelectionData.replace(d, { ...d, selected: !d.selected })
      }
    }

    comparePatient() {
      if (this.selectedPatients() == 0) {
        alert('Please select one or two patients')
        return
      }
      const sourceKey = this.sourceKey()
      const sampleId = this.sampleId()
      const cohortDefinitionId = this.cohortDefinitionId()
      const [person1, person2] = this.selectedPatients()
      if (person1 && person2) {
        const url = constants.paths.twoPersonSample({
          sourceKey,
          personId: person1,
          cohortDefinitionId,
          sampleId,
          secondPersonId: person2,
        })
        history.pushState(null, '', url)
        this.personId(person1)
        this.secondPersonId(person2)
        this.showPerson2(true)
      } else if (!person2) {
        if (this.timeline2) {
          this.timeline2.remove()
          this.timeline2 = null
        }
        const url = constants.paths.onePersonSample({
          sourceKey,
          personId: person1,
          cohortDefinitionId,
          sampleId,
        })
        history.pushState(null, '', url)
        this.personId(person1)
        this.secondPersonId(null)
        this.showPerson2(false)
      }
      $('.selectionPatient.close').trigger('click')
    }

    loadComparingPerson(secondPerson) {
      if (!secondPerson) {
        this.cantFindPerson(false)
        this.loadingPerson(true)
      } else {
        this.cantFindSecondPerson(false)
        this.loadingSecondPerson(true)
        this.showPerson2(true)
      }
      profileService
        .getProfile(
          this.sourceKey(),
          secondPerson || this.personId(),
          this.cohortDefinitionId()
        )
        .then(person => {
          // const records = person.records.filter(el => el.conceptId)
          const records = person.records
          if (!secondPerson) {
            this.loadingPerson(false)
            this.personRecords(records)
            this.person(person)
            if (!this.timeline1) {
              this.timeline1 = new Timeline('profileTimeline1')
              this.timeline1.updateData(records)
            } else {
              // get new timeline
              this.timeline1.removeInput()
              this.timeline1.updateData(records)
            }
          } else {
            this.loadingSecondPerson(false)
            this.secondPersonRecords(records)
            this.secondPersonGender(person.gender)
            this.secondPersonRecordCount(person.recordCount)
            this.secondPersonAgeAtIndex(person.ageAtIndex)
            if (!this.timeline2) {
              this.timeline2 = new Timeline('profileTimeline2')
              this.timeline2.updateData(records)
            } else {
              this.timeline2.removeInput()
              this.timeline2.updateData(records)
            }
          }
        })
        .catch(err => {
          console.error(err)
          // remove if error
          if (this.timeline1 && !secondPerson) {
            this.timeline1.remove()
            this.timeline1 = null
            this.cantFindPerson(true)
            this.loadingPerson(false)
          }
          if (this.timeline2 && secondPerson) {
            this.timeline2.remove()
            this.timeline2 = null
            this.cantFindSecondPerson(true)
            this.loadingSecondPerson(false)
          }
        })
    }

    loadNextPerson() {
      const currentPersonIndex = this.patientSelectionData().findIndex(
        el => el.personId == this.personId()
      )
      let nextIndex
      if (currentPersonIndex == this.patientSelectionData().length - 1) {
        nextIndex = 0
      } else {
        nextIndex = currentPersonIndex + 1
      }
      const nextPersonId = this.patientSelectionData()[nextIndex].personId
      this.selectedPatients().splice(0, 1, nextPersonId)
      this.personId(nextPersonId)
      this.patientSelectionData.replace(
        this.patientSelectionData()[currentPersonIndex],
        { ...this.patientSelectionData()[currentPersonIndex], selected: false }
      )
      this.patientSelectionData.replace(
        this.patientSelectionData()[nextIndex],
        { ...this.patientSelectionData()[nextIndex], selected: true }
      )
    }

    loadPreviousPerson() {
      const currentPersonIndex = this.patientSelectionData().findIndex(
        el => el.personId == this.personId()
      )
      let previousIndex
      if (currentPersonIndex == 0) {
        previousIndex = this.patientSelectionData().length - 1
      } else {
        previousIndex = currentPersonIndex - 1
      }
      const perviousPeronId = this.patientSelectionData()[previousIndex]
        .personId
      this.selectedPatients().splice(0, 1, perviousPeronId)
      this.personId(perviousPeronId)
      this.patientSelectionData.replace(
        this.patientSelectionData()[currentPersonIndex],
        { ...this.patientSelectionData()[currentPersonIndex], selected: false }
      )
      this.patientSelectionData.replace(
        this.patientSelectionData()[previousIndex],
        { ...this.patientSelectionData()[previousIndex], selected: true }
      )
    }

    removePerson() {
      const [person1, person2] = this.selectedPatients()
      this.selectedPatients([person2])
      this.comparePatient()
    }

    removePerson2() {
      const [person1, person2] = this.selectedPatients()
      this.selectedPatients.remove([person2])
      this.secondPersonId(null)
      this.timeline2.remove()
      this.timeline2 = null
      this.showPerson2(false)

      const secondPersonIndex = this.patientSelectionData().findIndex(
        el => el.personId == person2
      )

      this.patientSelectionData.replace(
        this.patientSelectionData()[secondPersonIndex],
        { ...this.patientSelectionData()[secondPersonIndex], selected: false }
      )
    }
  }

  return commonUtils.build('profile-manager', ProfileManager, view)
})
