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
      // sample redirect state
      this.isLoadingSampleData = ko.observable(false)
      this.patientSelectionData = ko.observableArray([])
      this.selectedPatients = ko.computed(() =>
        this.patientSelectionData().filter(el => el.selected)
      )
      this.sampleName = ko.observable()
      this.sampleId = ko.observable(router.routerParams().sampleId) // it shoule equa 'sample'
      this.fetchSampleData({
        sampleId: this.sampleId(),
        sourceKey: this.sourceKey(),
        cohortDefinitionId: this.cohortDefinitionId(),
      })
      this.sampleId.subscribe(val => {
        this.fetchSampleData({
          sampleId: val,
          sourceKey: this.sourceKey(),
          cohortDefinitionId: this.cohortDefinitionId(),
        })
      })

      this.secondPersonId = ko.observable(router.routerParams().secondPersonId)
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
      this.person = ko.observable()
      this.loadingPerson = ko.observable(false)
      this.cantFindPerson = ko.observable(false)
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
            return `<span data-bind="css: { selected: ${d}}" class="sample-select fa fa-check"></span>`
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
        document.location = constants.paths.person(this.sourceKey(), personId)
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

      if (this.personId()) {
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
          person.records.forEach(rec => {
            rec.highlight = this.defaultColor
            rec.stroke = this.defaultColor
          })
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
          console.log(res)
          this.sampleName(res.name)
          const transformedSampleData = res.elements.map(el => ({
            personId: el.personId,
            gender: gender(el.genderConceptId),
            ageIndex: el.age,
            eventCounts: el.recordCount || '',
            selected: false,
          }))

          this.patientSelectionData(transformedSampleData)
        })
        .catch(error => {
          console.error(error)
          alert('Error when fetching sample data, please try again later')
        })
        .finally(() => {
          this.isLoadingSampleData(false)
        })
    }
    onSampleDataClick(d) {
      //change checkbox state
      this.patientSelectionData.replace(d, { ...d, selected: !d.selected })
    }

    comparePatient() {
      if (this.selectedPatients().length > 2) {
        alert('You can select maximum 2 patients only')
        return
      }
    }
  }

  return commonUtils.build('profile-manager', ProfileManager, view)
})
