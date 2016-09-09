define(['knockout', 'text!./profile-manager.html', 'd3', 'appConfig', 'lodash', 'crossfilter/crossfilter', 'd3_tip', 'knockout.dataTables.binding', 'components/faceted-datatable-cf-profile', 'components/profileChart', 'css!./styles/profileManager.css'],
	function (ko, view, d3, config, lodash, crossfilter) {

		function profileManager(params) {
			window.d3 = d3;
			window._ = _;
			var self = this;
			window.profileManager = self;
			self.config = config;
			self.services = config.services[0];
			self.model = params.model;
			self.aspectRatio = ko.observable();

			self.sourceKey = ko.observable(util.getState('sourceKey'));
			self.personId = ko.observable(util.getState('personId'));
			self.cohortSource = ko.observable();
			self.person = ko.observable();
			self.loadingPerson = ko.observable(false);
			self.cantFindPerson = ko.observable(false)

			self.setSourceKey = function (d) {
				self.sourceKey(d.sourceKey);
			}

			self.sourceKeyCaption = ko.computed(function () {
				if (self.sourceKey()) {
					return self.sourceKey();
				} else {
					return "Select a Data Source";
				}
			});

			self.sourceKey.subscribe(function (sourceKey) {
				util.setState('sourceKey', sourceKey);
				/*
				self.cohortSource(_.find(
					self.model.cohortDefinitionSourceInfo(), {
						sourceKey: sourceKey
					}));
				self.personId(null);
				self.person(null);
				document.location = '#/profiles/' + sourceKey;
				*/
			});
			self.personId.subscribe(function (personId) {
				util.setState('personId', personId);
			});

			/*
			if (params.model.currentCohortDefinition()) {
				console.log("might be clobbering route here");
				self.sourceKey(self.services.sources[0].sourceKey);
			}
			*/
		  /*
			params.model.currentCohortDefinition.subscribe(function (def) {
				self.sourceKey(self.services.sources[0].sourceKey);
			});
			*/

			let personRequests = {};
			let personRequest;
			self.loadPerson = function () {
				self.cantFindPerson(false)
				self.loadingPerson(true);
				let url = self.services.url + self.sourceKey() + '/person/' + self.personId();
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
						self.loadingPerson(false);
						let cohort;
						let cohortDefinitionId = util.getState('currentCohortDefinitionId');
						if (cohortDefinitionId) {
							cohort = _.find(person.cohorts, { cohortDefinitionId });
						} else {
							cohort = {
								startDate: _.chain(person.records)
									.map(d => d.startDate)
									.min()
									.value()
							};
						}
						person.records.forEach(function (rec) {
							// have to get startDate from person.cohorts
							rec.startDay = Math.floor((rec.startDate - cohort.startDate) / (1000 * 60 * 60 * 24))
							rec.endDay = rec.endDate ?
								Math.floor((rec.endDate - cohort.startDate) / (1000 * 60 * 60 * 24)) : rec.startDay;
						});
						self.crossfilter(crossfilter(person.records));
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
					self.highlightRecs(self.filteredRecs().filter(d => d.conceptName === rec.conceptName));
				} else {
					self.highlightRecs([rec]);
				}
			};
			self.getGenderClass = ko.computed(function () {
				if (self.person()) {
					if (self.person().gender == 'FEMALE') {
						return "fa fa-female";
					} else if (self.person().gender == 'MALE') {
						return "fa fa-male";
					} else {
						return "fa fa-question";
					}
				}
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
					func: d => d.startDay,
					filter: ko.observable(null),
				},
				/*
				'search': {
						name: 'search',
						func: d => d,
						filter: ko.observable(null),
				},
				*/
				'wordcloud': {
					name: 'wordcloud',
					func: d => d.conceptName,
					filter: ko.observable(null),
					words: function (filteredRecs) {
						var needToLook = filteredRecs().length; // knockout won't fire this otherwise
						var stopWords = [
							'Outpatient Visit', 'No matching concept',
						];
						if (!self.dimensions.wordcloud.dimension) return [];
						var words = self.dimensions.wordcloud.group.top(20)
							.filter(d => d.value.length &&
								stopWords.indexOf(d.key) === -1)
							.map(d => {
								return {
									text: d.key,
									recs: d.value
								}
							});
						words = _.sortBy(words, d => -d.recs.length)
						var avgSize = average(words.map(d => d.recs.length));
						var std = standardDeviation(words.map(d => d.recs.length));
						words.forEach(word => {
							word.size = (100 + Math.round(((word.recs.length - avgSize) / std) * 10)) + '%';
						});
						return words;
					},
				},
			};
			self.searchHighlight = ko.observable();
			self.searchHighlight.subscribe(func => {
				if (func)
					self.highlight(self.filteredRecs().filter(func));
				else
					self.highlight([]);
			});
			self.facets = ['Domain'].map(d => self.dimensions[d]);
			var reduceToRecs = [(p, v, nf) => p.concat(v), (p, v, nf) => _.without(p, v), () => []];
			self.crossfilter(crossfilter([]));
			_.each(self.dimensions, dim => {
				dim.filter.subscribe(filter => {
					dim.dimension.filter(filter);
					self.filtersChanged(filter);
				});
			});
			self.filtersChanged.subscribe(() => {
				var groupAll = self.crossfilter().groupAll();
				groupAll.reduce(...reduceToRecs);
				self.filteredRecs(groupAll.value());
			});
			self.crossfilter.subscribe(cf => {
				_.each(self.dimensions, dim => {
					dim.dimension = cf.dimension(dim.func);
					dim.filter(null);
					dim.group = dim.dimension.group();
					dim.group.reduce(...reduceToRecs);
					dim.groupAll = dim.dimension.groupAll();
					dim.groupAll.reduce(...reduceToRecs);
					//dim.recs(dim.groupAll.value());
				});
				self.facets.forEach(facet => {
					facet.Members = [];
				});
				self.facetsObs.removeAll();
				self.facetsObs.push(...self.facets);
				var groupAll = self.crossfilter().groupAll();
				groupAll.reduce(...reduceToRecs);
				self.filteredRecs(groupAll.value());
			});

			self.showBrowser = function () {
				$('#cohortDefinitionChooser').modal('show');
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

			self.columns = [
				{
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
