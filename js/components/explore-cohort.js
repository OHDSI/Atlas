define(['knockout', 'text!./explore-cohort.html', 'd3', 'atlas-state', 'appConfig', 'services/AuthAPI', 'lodash', 'crossfilter', 'd3-tip', 'databindings', 'components/faceted-datatable-cf-profile'],
	function (ko, view, d3, sharedState, config, authApi, lodash, crossfilter) {

		function exploreCohort(params) {
			var self = this;
			window._ = _;
			window.exploreCohort = self;
			self.defaultFetchMax = 100;

			self.sources = ko.observableArray(sharedState.sources().filter(source => source.hasCDM));
			self.sourceKey = ko.observable();
			self.cohortDefinitionId = sharedState.CohortDefinition.current().id;
			self.breakdown = ko.observable({});
			self.cf = ko.observable({});
			self.facets = ko.observableArray([]);
			self.filtersChanged = ko.observable();
			self.filteredRecs = ko.observable([]);
			self.someMembers = ko.observableArray([]);
			self.membersChosen = ko.observable('');
			self.fetchMax = ko.observable(self.defaultFetchMax);
			self.loading = ko.observable(false);

			self.getBreakdown = function (source) {
				self.sourceKey(source.sourceKey);
				self.loading(true);
				$.ajax({
					url: config.api.url + 'cohortresults/' + source.sourceKey + '/' + self.cohortDefinitionId() + '/breakdown',
					method: 'GET',
					contentType: 'application/json',
					error: function (err) {
						self.loading(false);
					},
					success: function (breakdown) {
						let cf = crossfilter(breakdown);
						self.breakdown(breakdown);
						self.cf(cf);
						self.facets.removeAll();
						self.facets.push(..._.map(dimConfig, function (dc, dimKey) {
							let dim = _.clone(dc);
							dim.key = dimKey;
							dim.Members = [];
							dim.cfdim = cf.dimension(dim.func);
							dim.filter = ko.observable(null);
							dim.filter.subscribe(filter => {
								dim.cfdim.filter(filter);
								self.filtersChanged(filter);
							});
							dim.group = dim.cfdim.group();
							dim.group.reduceSum(d => d.people);
							dim.groupAll = dim.cfdim.groupAll();
							dim.groupAll.reduceSum(d => d.people);
							dim.countFunc = group => group.value;
							return dim;
						}));
						self.groupAll = self.cf()
							.groupAll();
						self.groupAll.reduceSum(d => d.people);
						self.filtersChanged.subscribe(() => {
							self.filteredRecs(self.groupAll.value());
						});
						self.filteredRecs.subscribe(function () {
							self.someMembers.removeAll();
							self.membersChosen(self.groupAll.value() + ' people in cohort matching:');
							let genders = self.facets()[0].Members.filter(d => d.Selected);
							let gender = genders.length ?
								genders.map(d => `'${d.Name}'`)
								.join(',') : "''";
							let ages = self.facets()[1].Members.filter(d => d.Selected);
							let age = ages.length ?
								ages.map(d => `'${d.Name}'`)
								.join(',') : "''";
							let conditionss = self.facets()[2].Members.filter(d => d.Selected);
							let conditions = conditionss.length ?
								conditionss.map(d => d.Name)
								.join(',') : "''";
							let drugss = self.facets()[3].Members.filter(d => d.Selected);
							let drugs = drugss.length ?
								drugss.map(d => d.Name)
								.join(',') : "''";
							let url = config.api.url + 'cohortresults/' + source.sourceKey + '/' + self.cohortDefinitionId() + '/breakdown/' + gender + '/' + age + '/' + conditions + '/' + drugs + '/' + 100; // max number of cohort people to retrieve
							$.ajax({
								url: url,
								method: 'GET',
								contentType: 'application/json',
								success: function (people) {
									people.forEach(function (person) {
										//person.url = '#/profiles/' + source.sourceKey + '/' + self.cohortDefinitionId() + '/' + person.personId;
										person.url = '#/profiles/' + source.sourceKey + '/' + person.personId + '/' + self.cohortDefinitionId();
									});
									self.someMembers.removeAll();
									self.someMembers.push(...people);
									self.fetchMax(Math.min(self.defaultFetchMax, people.length));
								}
							});
						});
						self.filteredRecs(self.breakdown());
						self.loading(false);
					}
				});
			}

			self.selectedDesc = function (facet) {
				let selected = facet.Members.filter(d => d.Selected);
				if (selected.length) {
					if (['gender', 'age'].indexOf(facet.key) > -1) {
						if (selected.length > 1) {
							return `${facet.caption}:
										${selected.slice(0,selected.length-1).map(d=>d.Name).join(', ')}
										or ${selected[selected.length-1].Name}`;
						} else {
							return `${facet.caption}: ${selected[0].Name}`;
						}
					} else {
						if (selected.length > 1) {
							return `People with
										${selected.slice(0,selected.length-1).map(d=>d.Name).join(', ')}
										or ${selected[selected.length-1].Name} ${facet.key}`;
						} else {
							return `People with ${selected[0].Name} ${facet.key}`;
						}
					}
				} else {
					if (['gender', 'age'].indexOf(facet.key) > -1) {
						return `${facet.caption}: all`;
					} else {
						return `People with any number of ${facet.key}`;
					}
				}
			};
			var dimConfig = {
				'gender': {
					caption: 'Gender',
					func: d => d.gender,
					suffix: '',
					//filter: ko.observable(null),
					//Members: [],
				},
				'age': {
					caption: 'Age range',
					func: d => d.age,
					suffix: '',
					//filter: ko.observable(null),
					//Members: [],
				},
				'conditions': {
					caption: 'Condition density',
					func: d => d.conditions,
					suffix: ' conditions',
					//filter: ko.observable(null),
					//Members: [],
				},
				'drugs': {
					caption: 'Drug density',
					func: d => d.drugs,
					suffix: ' drugs',
					//filter: ko.observable(null),
					//Members: [],
				},
			};
			self.columns = [{
					title: 'Gender',
					data: 'gender'
				},
				{
					title: 'Age range',
					data: 'age'
				},
				{
					title: 'Condition density',
					data: 'conditions'
				},
				{
					title: 'Drug density',
					data: 'drugs'
				},
			];
		}

		var component = {
			viewModel: exploreCohort,
			template: view
		};
		ko.components.register('explore-cohort', component);
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
