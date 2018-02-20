"use strict";
define(['knockout', 'text!./profile-manager.html', 'd3', 'appConfig', 'webapi/AuthAPI', 'lodash', 'crossfilter', 'ohdsi.util', 'cohortbuilder/CohortDefinition', 'webapi/CohortDefinitionAPI', 'd3-tip', 'databindings', 'faceted-datatable', 'components/profileChart', 'css!./styles/profileManager.css', 'access-denied'],
	function (ko, view, d3, config, authApi, _, crossfilter, util, CohortDefinition, cohortDefinitionAPI) {

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
			self.loadingStatus = ko.observable('loading');

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

			self.isAuthenticated = authApi.isAuthenticated;
			self.canViewProfiles = ko.pureComputed(function () {
			  return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedViewProfiles()) || !config.userAuthenticationEnabled;
			});

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

				self.loadingStatus('loading profile data from database');
				personRequest = personRequests[url] = $.ajax({
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
						self.loadingStatus('processing profile data');
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
							rec.startDay = Math.floor((rec.startDate - cohort.startDate) / (1000 * 60 * 60 * 24));
							rec.endDay = rec.endDate ? Math.floor((rec.endDate - cohort.startDate) / (1000 * 60 * 60 * 24)) : rec.startDay;
							rec.highlight = self.defaultColor;
							rec.stroke = self.defaultColor;
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
				self.highlightRecs([{
					'color': '#f00',
					'recs': recs
				}] || []);
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

			self.highlightData = ko.observableArray();
			self.defaultColor = '#888';

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
							if (d.key.toLowerCase().indexOf(self.filterHighlightsText().toLowerCase()) == -1) {
								filtered = false;
							}
						}
						return d.value.length && stopWords.indexOf(d.key) === -1 && filtered;
					})
					.map(d => {
						return {
							caption: d.key,
							domain: d.value[0].domain,
							text: d.key,
							recs: d.value,
							count: d.value.length,
							highlight: ko.observable(self.defaultColor)
						}
					});
				words = _.sortBy(words, d => -d.recs.length)
				self.highlightData(words);
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

			self.swatch = function (d) {
				return '<div class="swatch" style="background-color:' + d + '"></div>';
			}

			self.highlightDom = '<<"row vertical-align"<"col-xs-6"><"col-xs-6 search"f>><t><"row vertical-align"<"col-xs-6"i><"col-xs-6"p>>>';
			self.highlightColumns = ['select', {
				render: self.swatch,
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

			self.columns = [{
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

			self.daysBeforeIndex = function (d) {
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
			self.setHighlights = function (colorIndex) {
				var selectedData = $('#highlight-table table').DataTable().rows('.selected').data();
				for (var i = 0; i < selectedData.length; i++) {
					selectedData[i].highlight(self.getHighlightBackground(colorIndex)); // set the swatch color
					selectedData[i].recs.forEach(r => {
						r.highlight = self.getHighlightBackground(colorIndex);
						r.stroke = self.getHighlightColor(colorIndex);
					}); // set the record colors
				};

				self.highlightRecs.valueHasMutated();
			}

			// d3.schemePaired
			self.palette = ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ff9', '#b15928'];

			self.getHighlightColor = function (i) {
				return self.palette[i * 2];
			}

			self.getHighlightBackground = function (i) {
				return self.palette[i * 2 + 1];
			}

			self.clearHighlights = function () {
				var selectedData = $('#highlight-table table').DataTable().data();
				for (var i = 0; i < selectedData.length; i++) {
					selectedData[i].highlight(self.defaultColor); // set the swatch color
					selectedData[i].recs.forEach(r => {
						r.highlight = self.defaultColor; // set the record colors
						r.stroke = self.defaultColor; // set the record colors
					})
				};

				self.highlightRecs.valueHasMutated();
			}

			self.highlightRowClick = function (data, evt, row) {
				evt.stopPropagation();
				$(row).toggleClass('selected');
			}
			self.highlightOptions = {};
			self.options = {
				Facets: [{
					'caption': 'Domain',
					'binding': d => d.domain,
				}]
			};

			$("#modalHighlights").draggable();

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
