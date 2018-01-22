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

			self.sourceKey = ko.observable(params.sourceKey);
			self.personId = ko.observable(params.personId);
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
				//console.log(conceptSet.name, ids);
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
						// In the event that we could not find
						// the matching cohort in the person object
						// or the cohort definition id is not specified
						// default it
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
						person.shadedRegions =
							person.observationPeriods.map(op => {
								return {
									x1: Math.floor((op.startDate - cohort.startDate) / (1000 * 60 * 60 * 24)),
									x2: Math.floor((op.endDate - cohort.startDate) / (1000 * 60 * 60 * 24)),
									className: 'observation-period',
								};
							});
						self.crossfilter(crossfilter(person.records));
						self.shadedRegions(person.shadedRegions);
						self.person(person);
					}
				});
			};

			//self.sourceKey(params.model.sourceKey);
			//self.personId(params.model.personId);

			self.crossfilter = ko.observable();
			self.filtersChanged = ko.observable();
			self.filteredRecs = ko.observableArray([]);
			self.facetsObs = ko.observableArray([]);
			self.highlightRecs = ko.observableArray([]);
			self.highlight = function (recs, evt) {
				self.highlightRecs(recs || []);
			};
			self.datatableRowClickCallback = function (rec) {
				if (event.target.childNodes[0].data === rec.conceptName) {
					self.highlightRecs(self.filteredRecs()
						.filter(d => d.conceptName === rec.conceptName));
				} else {
					self.highlightRecs([rec]);
				}
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

			self.dimensions = {
				'Domain': {
					caption: 'Domain',
					func: d => d.domain,
					filter: ko.observable(null),
					Members: [], //ko.observableArray([{Name:'foo', ActiveCount:'bar',Selected:false}]),
				},
				/*
				'Year Start': {
						caption: 'Year Start',
						func: d => new Date(d.startDate).getFullYear(),
						filter: ko.observable(null),
						Members: [],//ko.observableArray([]),
				},
				*/
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
				'concepts': { // includes conceptSets and specific conceptName
					name: 'concepts',
					isArray: true,
					func: d => {
						return (_.chain(self.conceptSets())
							.map(function (ids, conceptSetName) {
								if (_.includes(ids, d.conceptId))
									//return conceptSetName;
									return conceptSetName + '-cs';
							})
							.compact()
							.value()
							.concat(d.conceptName)
							//.concat(d.conceptName + '-c')
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
				var recs = self.filteredRecs();
				var conceptSets = self.conceptSets();
				self.dimensionSetup(self.dimensions.concepts,
					self.crossfilter());
				//self.crossfilter.valueHasMutated();
				//console.log(conceptSets);
				var stopWords = [
					'Outpatient Visit', 'No matching concept',
				];
				if (!self.dimensions.concepts.dimension) return [];
				var words = self.dimensions.concepts.group.top(20)
					.filter(d => d.value.length &&
						stopWords.indexOf(d.key) === -1)
					.map(d => {
						return {
							//text: d.key,
							text: `${d.key} (${d.value.length})`,
							recs: d.value
						}
					});
				words = _.sortBy(words, d => -d.recs.length)
				/* not varying word size anymore
				var avgSize = average(words.map(d => d.recs.length));
				var std = standardDeviation(words.map(d => d.recs.length));
				words.forEach(word => {
					word.size = (100 + Math.round(((word.recs.length - avgSize) / std) * 10)) + '%';
				});
				*/
				//console.log(words);
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
			self.facets = ['Domain'].map(d => self.dimensions[d]);
			self.crossfilter(crossfilter([]));
			_.each(self.dimensions, dim => {
				dim.filter.subscribe(filter => {
					dim.dimension.filter(filter);
					self.filtersChanged(filter);
				});
			});
			self.filtersChanged.subscribe(() => {
				var groupAll = self.crossfilter()
					.groupAll();
				groupAll.reduce(...reduceToRecs);
				self.filteredRecs(groupAll.value());
			});
			self.crossfilter.subscribe(cf => {
				_.each(self.dimensions, dim => {
					self.dimensionSetup(dim, cf);
					//dim.recs(dim.groupAll.value());
				});
				self.facets.forEach(facet => {
					facet.Members = [];
				});
				self.facetsObs.removeAll();
				self.facetsObs.push(...self.facets);
				var groupAll = self.crossfilter()
					.groupAll();
				groupAll.reduce(...reduceToRecs);
				self.filteredRecs(groupAll.value());
			});

			self.showBrowser = function () {
				$('#cohortDefinitionChooser')
					.modal('show');
			};

			self.cohortDefinitionButtonText = ko.observable('Click Here to Select a Cohort');

			self.showSection = {
				profileChart: ko.observable(true),
				wordcloud: ko.observable(true),
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

		function standardDeviation(values) {
			var avg = average(values);

			var squareDiffs = values.map(function (value) {
				var diff = value - avg;
				var sqrDiff = diff * diff;
				return sqrDiff;
			});

			var avgSquareDiff = average(squareDiffs);

			var stdDev = Math.sqrt(avgSquareDiff);
			return stdDev;
		}

		function average(data) {
			var sum = data.reduce(function (sum, value) {
				return sum + value;
			}, 0);

			var avg = sum / data.length;
			return avg;
		}
	});
