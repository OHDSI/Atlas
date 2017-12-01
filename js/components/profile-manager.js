"use strict";
define(['knockout', 'text!./profile-manager.html', 'd3', 'appConfig', 'lodash', 'crossfilter', 'ohdsi.util', 'cohortbuilder/CohortDefinition', 'webapi/CohortDefinitionAPI', 'd3-tip', 'knockout.dataTables.binding', 'faceted-datatable', 'components/profileChart', 'css!./styles/profileManager.css'],
	function (ko, view, d3, config, _, crossfilter, util, CohortDefinition, cohortDefinitionAPI) {

		var reduceToRecs = [ // crossfilter group reduce functions where group val
			// is an array of recs in the group
			(p, v, nf) => p.concat(v),
			(p, v, nf) => _.without(p, v),
			() => []
		];

		function profileManager(params) {
			window.d3 = d3;
			window._ = _;
			var self = this;
			window.profileManager = self;
			self.model = params.model;
			self.aspectRatio = ko.observable();
			self.config = config;
			self.filterHighlightsText = ko.observable();

			self.sourceKey = ko.observable(params.sourceKey);
			self.personId = ko.observable(params.personId);
			self.personRecords = ko.observableArray();

			self.cohortDefinitionId = ko.observable(params.cohortDefinitionId);
			self.currentCohortDefinition = ko.observable(null);

			// if a cohort definition id has been specified, see if it is
			// already loaded into the page model. If not, load it from the
			// server
			if (self.cohortDefinitionId() && (self.model.currentCohortDefinition() && self.model.currentCohortDefinition()
					.id() == self.cohortDefinitionId)) {
				// The cohort definition requested is already loaded into the page model - just reference it
				self.currentCohortDefinition(self.model.currentCohortDefintion())
			} else if (self.cohortDefinitionId()) {
				cohortDefinitionAPI.getCohortDefinition(self.cohortDefinitionId())
					.then(function (cohortDefinition) {
						cohortDefinition.expression = JSON.parse(cohortDefinition.expression);
						self.currentCohortDefinition(new CohortDefinition(cohortDefinition));
					});
			}

			self.cohortSource = ko.observable();
			self.person = ko.observable();
			self.loadingPerson = ko.observable(false);
			self.cantFindPerson = ko.observable(false);
			self.shadedRegions = ko.observable([]);

			self.setSourceKey = function (d) {
				self.sourceKey(d.sourceKey);
			}

			self.cohortDefSource = ko.computed(function () {
				return {
					cohortDef: self.currentCohortDefinition(),
					sourceKey: self.sourceKey(),
				};
			});
			self.cohortDefSource.subscribe(function (o) {
				self.loadConceptSets(o);
			});
			self.loadConceptSets = function (o) {
				if (!o.cohortDef)
					return;
				var conceptSets = ko.toJS(o.cohortDef.expression()
					.ConceptSets());
				conceptSets.forEach(function (conceptSet) {
					pageModel.resolveConceptSetExpressionSimple(
						ko.toJSON(conceptSet.expression),
						_.bind(self.loadedConceptSet, self, conceptSet))
				});
			};
			self.conceptSets = ko.observable({});
			self.loadedConceptSet = function (conceptSet, ids, status) {
				self.conceptSets(_.extend({}, self.conceptSets(), {
					[conceptSet.name]: ids
				}));
			}
			self.loadConceptSets(self.cohortDefSource());

			self.sourceKeyCaption = ko.computed(function () {
				if (self.sourceKey()) {
					return self.sourceKey();
				} else {
					return "Select a Data Source";
				}
			});

			self.sourceKey.subscribe(function (sourceKey) {
				document.location = '#/profiles/' + sourceKey;
			});
			self.personId.subscribe(function (personId) {
				document.location = "#/profiles/" + self.sourceKey() + '/' + personId;
			});

			let personRequests = {};
			let personRequest;
			self.loadPerson = function () {
				self.cantFindPerson(false)
				self.loadingPerson(true);

				let url = self.config.api.url + self.sourceKey() + '/person/' + self.personId();
				personRequest = personRequests[url] = util.cachedAjax({
					url: url,
					method: 'GET',
					contentType: 'application/json',
					error: function (err) {
						self.cantFindPerson(true);
						self.loadingPerson(false);
					},
					success: function (person) {
						if (personRequest !== personRequests[url]) {
							return;
						}
						person.personId = self.personId();
						self.loadingPerson(false);
						let cohort;
						let cohortDefinitionId = self.cohortDefinitionId();
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
						person.age = new Date(cohort.startDate)
							.getFullYear() - person.yearOfBirth;
						person.records.forEach(function (rec) {
							// have to get startDate from person.cohorts
							rec.startDay = Math.floor((rec.startDate - cohort.startDate) / (1000 * 60 * 60 * 24))
							rec.endDay = rec.endDate ?
								Math.floor((rec.endDate - cohort.startDate) / (1000 * 60 * 60 * 24)) : rec.startDay;
						});
						self.personRecords(person.records);
						person.shadedRegions =
							person.observationPeriods.map(op => {
								return {
									x1: Math.floor((op.startDate - cohort.startDate) / (1000 * 60 * 60 * 24)),
									x2: Math.floor((op.endDate - cohort.startDate) / (1000 * 60 * 60 * 24)),
									className: 'observation-period',
								};
							});
						self.shadedRegions(person.shadedRegions);
						self.person(person);
					}
				});
			};

			self.xfObservable = ko.observable();
			self.xfDimensions = [];
			self.highlightEnabled = ko.observable(false);
			self.filtersChanged = ko.observable();
			self.facetsObs = ko.observableArray([]);
			self.removeHighlight = function () {
				self.highlight([]);
			}
			self.highlightRecs = ko.observableArray([]);
			self.highlight = function (recs, evt) {
				if (recs && recs.length > 0) {
					self.highlightEnabled(true);
				} else {
					self.highlightEnabled(false);
				}
				self.highlightRecs(recs || []);
			};

			self.getGenderClass = ko.computed(function () {
				if (self.person()) {
					if (self.person()
						.gender == 'FEMALE') {
						return "fa fa-female";
					} else if (self.person()
						.gender == 'MALE') {
						return "fa fa-male";
					} else {
						return "fa fa-question";
					}
				}
			});
			self.age = ko.computed(function () {
				if (self.person()) {}
			});

			$('.highlight-filter').on('click', function (evt) {
				return false;
			});

			self.dimensions = {
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
						return (_.chain(self.conceptSets())
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

			self.dimensionSetup = function (dim, cf) {
				if (!cf) return;
				dim.dimension = cf.dimension(dim.func, dim.isArray);
				dim.filter(null);
				dim.group = dim.dimension.group();
				dim.group.reduce(...reduceToRecs);
				dim.groupAll = dim.dimension.groupAll();
				dim.groupAll.reduce(...reduceToRecs);
			};

			self.words = ko.computed(function () {
				if (!self.xfObservable())
					return;

				if (self.xfDimensions.length == 0) {
					self.xfDimensions.push(self.xfObservable().dimension(d => d.startDay));
				}

				var recs = self.xfObservable().allFiltered();

				var conceptSets = self.conceptSets();
				self.dimensionSetup(self.dimensions.concepts, self.xfObservable());

				var stopWords = [
					'Outpatient Visit', 'No matching concept',
				];

				var words = self.dimensions.concepts.group.all()
					.filter(d => {
						var filtered = true;
						if (self.filterHighlightsText() && self.filterHighlightsText().length > 0) {
							if (d.key.toLowerCase().indexOf(self.filterHighlightsText().toLowerCase())==-1)					 
							{
								filtered = false;
							}
						}

						return d.value.length && stopWords.indexOf(d.key) === -1 && filtered;
					})
					.map(d => {
						if (d.key.length > 100) {
							d.caption = d.key.substring(0, 97) + '...';
						} else {
							d.caption = d.key;
						}
						return {
							caption: d.caption + ' (' + d.value.length + ')',
							text: d.key,
							recs: d.value
						}
					});
				words = _.sortBy(words, d => -d.recs.length)
				return words;
			});

			self.searchHighlight = ko.observable();

			self.searchHighlight.subscribe(func => {
				if (func)
					self.highlight(self.filteredRecs()
						.filter(func));
				else
					self.highlight([]);
			});
			self.cohortDefinitionButtonText = ko.observable('Click Here to Select a Cohort');

			self.showSection = {
				profileChart: ko.observable(true),
				datatable: ko.observable(true),
			};

			self.dispToggle = function (pm, evt) {
				let section = evt.target.value;
				self.showSection[section](!self.showSection[section]());
			};

			self.columns = [{
					title: 'Domain',
					data: 'domain'
				},
				{
					title: 'Concept Id',
					data: 'conceptId'
				},
				{
					title: 'Concept Name',
					data: 'conceptName'
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

			self.options = {
				Facets: [{
					'caption': 'Domain',
					'binding': d => d.domain,
				}, ]
			};

			if (self.personId()) {
				self.loadPerson();
			}
		}

		var component = {
			viewModel: profileManager,
			template: view
		};

		ko.components.register('profile-manager', component);
		return component;
	});
