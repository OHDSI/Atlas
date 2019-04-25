"use strict";
define([
		'knockout',
		'text!./profile-manager.html',
		'd3',
		'appConfig',
		'services/AuthAPI',
		'services/Profile',
		'atlas-state',
		'components/cohortbuilder/CohortDefinition',
		'services/CohortDefinition',
		'pages/Page',
		'utils/AutoBind',
		'utils/CommonUtils',
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
	'components/ac-access-denied'
	],
	function (
		ko,
		view,
		d3,
		config,
		authApi,
		profileService,
		sharedState,
		CohortDefinition,
		cohortDefinitionService,
		Page,
		AutoBind,
		commonUtils,
		constants,
		_,
		crossfilter,
		util,
	) {

		var reduceToRecs = [ // crossfilter group reduce functions where group val
			// is an array of recs in the group
			(p, v, nf) => p.concat(v),
			(p, v, nf) => _.without(p, v),
			() => []
		];

		class ProfileManager extends AutoBind(Page) {
			constructor(params) {
				super(params);
				this.model = params.model;
				this.sharedState = sharedState;
				this.aspectRatio = ko.observable();
				this.config = config;
				this.filterHighlightsText = ko.observable();
				this.loadingStatus = ko.observable('loading');

				this.sourceKey = ko.observable(params.routerParams().sourceKey);
				this.personId = ko.observable(params.routerParams().personId);
				this.personRecords = ko.observableArray();

				this.cohortDefinitionId = ko.observable(params.routerParams().cohortDefinitionId);
				this.currentCohortDefinition = ko.observable(null);
				// if a cohort definition id has been specified, see if it is
				// already loaded into the page model. If not, load it from the
				// server
				if (this.cohortDefinitionId() &&
					(
						this.model.currentCohortDefinition() &&
						this.model.currentCohortDefinition().id() === this.cohortDefinitionId
					)
				) {
					// The cohort definition requested is already loaded into the page model - just reference it
					this.currentCohortDefinition(this.model.currentCohortDefintion())
				} else if (this.cohortDefinitionId()) {
					cohortDefinitionService.getCohortDefinition(this.cohortDefinitionId())
						.then((cohortDefinition) => {
							this.currentCohortDefinition(new CohortDefinition(cohortDefinition));
						});
				}
				this.isAuthenticated = authApi.isAuthenticated;
				this.permittedSources = ko.computed(() => sharedState.sources().filter(s => authApi.isPermittedViewProfiles(s.sourceKey)));
				this.canViewProfiles = ko.computed(() => {
					return (config.userAuthenticationEnabled && this.isAuthenticated() && this.permittedSources().length > 0) || !config.userAuthenticationEnabled;
				});

				this.cohortSource = ko.observable();
				this.person = ko.observable();
				this.loadingPerson = ko.observable(false);
				this.cantFindPerson = ko.observable(false);
				this.shadedRegions = ko.observable([]);

				this.setSourceKey = (d) => {
					this.sourceKey(d.sourceKey);
				};

				this.cohortDefSource = ko.computed(() => {
					return {
						cohortDef: this.currentCohortDefinition(),
						sourceKey: this.sourceKey(),
					};
				});
				this.cohortDefSource.subscribe((o) => {
					this.loadConceptSets(o);
				});
				this.loadConceptSets = (o) => {
					if (!o.cohortDef)
						return;
					var conceptSets = ko.toJS(o.cohortDef.expression()
						.ConceptSets());
					conceptSets.forEach((conceptSet) => {
						this.model.resolveConceptSetExpressionSimple(
							ko.toJS(conceptSet.expression),
							_.bind(this.loadedConceptSet, this, conceptSet))
					});
				};
				this.conceptSets = ko.observable({});
				this.loadedConceptSet = (conceptSet, ids, status) => {
					this.conceptSets(_.extend({}, this.conceptSets(), {
						[conceptSet.name]: ids
					}));
				};
				this.loadConceptSets(this.cohortDefSource());

				this.sourceKeyCaption = ko.computed(() => {
					return this.sourceKey() || "Select a Data Source";
				});
				this.personRequests = {};
				this.personRequest;
				this.xfObservable = ko.observable();
				this.xfDimensions = [];
				this.crossfilter = ko.observable();
				this.highlightEnabled = ko.observable(false);
				this.filteredRecs = ko.observableArray([]);
				this.filtersChanged = ko.observable();
				this.facetsObs = ko.observableArray([]);
				this.highlightRecs = ko.observableArray([]);
				this.getGenderClass = ko.computed(() => {
					if (this.person()) {
						if (this.person()
							.gender === 'FEMALE') {
							return "fa fa-female";
						} else if (this.person()
							.gender === 'MALE') {
							return "fa fa-male";
						} else {
							return "fa fa-question";
						}
					}
				});
				this.dimensions = {
					'Domain': {
						caption: 'Domain',
						func: d => d.domain,
						filter: ko.observable(null),
						Members: [],
					},
					'profileChart': {
						name: 'profileChart',
						func: d => [d.startDay, d.endDay],
						filter: ko.observable(null),
					},
					'conceptName': {
						name: 'conceptName',
						func: d => d.conceptName,
						filter: ko.observable(null),
					},
					'concepts': {
						name: 'concepts',
						isArray: true,
						func: d => {
							return (_.chain(this.conceptSets())
								.map(function (ids, conceptSetName) {
									if (_.includes(ids, d.conceptId))
										return '<i class="fa fa-shopping-cart"></i> ' + conceptSetName;
								})
								.compact()
								.value()
								.concat(d.conceptName)
							);
						},
						filter: ko.observable(null),
					},
				};
				this.searchHighlight = ko.observable();
				this.highlightData = ko.observableArray();
				this.defaultColor = '#888';
				this.words = ko.computed(() => {
					if (!this.xfObservable()) {
						return;
					}
					if (this.xfDimensions.length == 0) {
						this.xfDimensions.push(this.xfObservable().dimension(function (d) {
							return d;
						}));
					}
					// var recs = this.xfObservable().allFiltered();
					// var conceptSets = this.conceptSets();
					this.dimensionSetup(this.dimensions.concepts, this.xfObservable());
					const stopWords = [
						'Outpatient Visit', 'No matching concept',
					];
					let words = this.dimensions.concepts.group.all()
						.filter(d => {
							let filtered = true;
							if (this.filterHighlightsText() && this.filterHighlightsText().length > 0) {
								if (d.key.toLowerCase().indexOf(this.filterHighlightsText().toLowerCase()) == -1) {
									filtered = false;
								}
							}
							return d.value.length && stopWords.indexOf(d.key) === -1 && filtered;
						});
						words = words.map(d => {
							return {
								caption: d.key,
								domain: d.value[0].domain,
								text: d.key,
								recs: d.value,
								count: d.value.length,
								highlight: ko.observable(this.defaultColor)
							}
						});
						words = _.sortBy(words, d => -d.recs.length)
					// profile chart will render all data in case when no data is captured by filter
					if (words.length !== 0) {
						this.highlightData(words);
					}
				});
				this.searchHighlight.subscribe(func => {
					if (func)
						this.highlight(this.filteredRecs()
							.filter(func));
					else
						this.highlight([]);
				});
				this.cohortDefinitionButtonText = ko.observable('Click Here to Select a Cohort');

				this.showSection = {
					profileChart: ko.observable(true),
					datatable: ko.observable(true),
				};
				this.highlightDom = '<<"row vertical-align"<"col-xs-6"><"col-xs-6 search"f>><t><"row vertical-align"<"col-xs-6"i><"col-xs-6"p>>>';
				this.highlightColumns = ['select', {
					render: this.swatch,
					data: 'highlight()',
					sortable: false
				}, {
					title: 'Concept Name',
					data: 'caption'
				}, {
					title: 'Domain',
					data: 'domain'
				}, {
					title: 'Total Records',
					data: 'count'
				}];

				this.columns = [{
						title: 'Concept Id',
						data: 'conceptId'
					},
					{
						title: 'Concept Name',
						data: 'conceptName'
					},
					{
						title: 'Domain',
						data: 'domain'
					},
					{
						title: 'Start Day',
						data: 'startDay'
					},
					{
						title: 'End Day',
						data: 'endDay'
					}
				];
				// d3.schemePaired
				this.palette = ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ff9', '#b15928'];


				this.sourceKey.subscribe((sourceKey) => {
					document.location = constants.paths.source(sourceKey);
				});
				this.personId.subscribe((personId) => {
					document.location = constants.paths.person(this.sourceKey(), personId);
				});

				$('.highlight-filter').on('click', function (evt) {
					return false;
				});

				this.highlightOptions = {};
				this.options = {
					Facets: [{
						'caption': 'Domain',
						'binding': d => d.domain,
					}]
				};

				$("#modalHighlights").draggable();

				if (this.personId()) {
					this.loadPerson();
				}
			}

			loadPerson() {
				this.cantFindPerson(false);
				this.loadingPerson(true);
				this.xfDimensions = [];

				let url = constants.paths.person(this.sourceKey(), this.personId());

				this.loadingStatus('loading profile data from database');
				this.personRequest = this.personRequests[url] = profileService.getProfile(this.sourceKey(), this.personId(), this.cohortDefinitionId())
					.then((person) => {
						if (this.personRequest !== this.personRequests[url]) {
							return;
						}
						this.loadingStatus('processing profile data');
						person.personId = this.personId();
						this.loadingPerson(false);
						let cohort;
						let cohortDefinitionId = this.cohortDefinitionId();
						if (cohortDefinitionId) {
							cohort = _.find(person.cohorts, function (o) {
								return o.cohortDefinitionId == cohortDefinitionId;
							});
						}
						// In the event that we could not find the matching cohort in the person object or the cohort definition id is not specified default it
						if (typeof cohort === "undefined") {
							cohort = {
								startDate: _.chain(person.records)
									.map(d => d.startDate)
									.min()
									.value()
							};
						}
						person.records.forEach((rec) => {
							// have to get startDate from person.cohorts
							// rec.startDay = Math.floor((rec.startDate - cohort.startDate) / (1000 * 60 * 60 * 24));
							// rec.endDay = rec.endDate ? Math.floor((rec.endDate - cohort.startDate) / (1000 * 60 * 60 * 24)) : rec.startDay;
							rec.highlight = this.defaultColor;
							rec.stroke = this.defaultColor;
						});
						this.personRecords(person.records);
						person.shadedRegions =
							person.observationPeriods.map(op => {
								return {
									x1: op.x1,
									x2: op.x2,
									className: 'observation-period',
								};
							});
						this.shadedRegions(person.shadedRegions);
						this.person(person);
					})
					.catch(() => {
						this.cantFindPerson(true);
						this.loadingPerson(false);
					});
			}

			removeHighlight() {
				this.highlight([]);
			}

			highlight(recs, evt) {
				if (recs && recs.length > 0) {
					this.highlightEnabled(true);
				} else {
					this.highlightEnabled(false);
				}
				this.highlightRecs([{
					'color': '#f00',
					'recs': recs
				}] || []);
			}

			dimensionSetup(dim, cf) {
				if (!cf) return;
				dim.dimension = cf.dimension(dim.func, dim.isArray);
				dim.filter(null);
				dim.group = dim.dimension.group();
				dim.group.reduce(...reduceToRecs);
				dim.groupAll = dim.dimension.groupAll();
				dim.groupAll.reduce(...reduceToRecs);
			}

			dispToggle(pm, evt) {
				let section = evt.target.value;
				this.showSection[section](!this.showSection[section]());
			}

			swatch(d) {
				return '<div class="swatch" style="background-color:' + d + '"></div>';
			}

			daysBeforeIndex(d) {
				if (d.startDay >= -30 && d.startDay <= 0) {
					return '0-30 days';
				} else if (d.startDay >= -60 && d.startDay < -30) {
					return '31-60 days';
				} else if (d.startDay >= -90 && d.startDay < -60) {
					return '61-90 days';
				} else if (d.startDay < -90) {
					return '90+ days';
				}
			}

			setHighlights(colorIndex) {
				var selectedData = $('#highlight-table table').DataTable().rows('.selected').data();
				for (var i = 0; i < selectedData.length; i++) {
					selectedData[i].highlight(this.getHighlightBackground(colorIndex)); // set the swatch color
					selectedData[i].recs.forEach(r => {
						r.highlight = this.getHighlightBackground(colorIndex);
						r.stroke = this.getHighlightColor(colorIndex);
					}); // set the record colors
				}

				this.highlightRecs.valueHasMutated();
			};

			getHighlightColor(i) {
				return this.palette[i * 2];
			}

			getHighlightBackground(i) {
				return this.palette[i * 2 + 1];
			}

			clearHighlights() {
				const selectedData = $('#highlight-table table').DataTable().data();
				for (let i = 0; i < selectedData.length; i++) {
					selectedData[i].highlight(this.defaultColor); // set the swatch color
					selectedData[i].recs.forEach(r => {
						r.highlight = this.defaultColor; // set the record colors
						r.stroke = this.defaultColor; // set the record colors
					})
				}

				this.highlightRecs.valueHasMutated();
			}

			highlightRowClick(data, evt, row) {
				evt.stopPropagation();
				$(row).toggleClass('selected');
			}
		}

		return commonUtils.build('profile-manager', ProfileManager, view);
	});