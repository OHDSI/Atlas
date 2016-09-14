define(['knockout', 'text!./explore-cohort.html', 'd3', 'appConfig', 'webapi/AuthAPI', 'lodash', 'crossfilter/crossfilter', 'd3_tip', 'knockout.dataTables.binding', 'components/faceted-datatable-cf-profile', 'css!./styles/exploreCohort.css'],
	function (ko, view, d3, config, authApi, lodash, crossfilter) {

		function exploreCohort(params) {
			var self = this;
			self.sources = ko.observableArray([]);
			self.sourceKey = ko.observable(util.getState('sourceKey'));
			window._ = _;
			window.exploreCohort = self;
			self.defaultFetchMax = 100;
			self.sourceKey.subscribe(function(sourceKey) {
				util.setState('sourceKey', sourceKey);
			});
			/*
			self.cohortDefSource = ko.computed(function() {
				return {
									cohortDef: params.model.currentCohortDefinition(),
									sourceKey: self.sourceKey(),
				};
			});
			self.cohortDefSource.subscribe(function(o) {
				self.loadConceptSets(o);
			});
			self.loadConceptSets = function(o) {
				var conceptSets = ko.toJS(o.cohortDef.expression().ConceptSets());
				var cs = {};
				window.cs = cs;
				conceptSets.forEach(function(conceptSet) {
					var success = function(results) {
						console.log(results);
						cs[conceptSet.name] = results;
					};
					pageModel.resolveConceptSetExpressionSimple(
						ko.toJSON(conceptSet.expression), success)
				});
			};
			self.loadConceptSets(self.cohortDefSource());
			*/

			params.services.sources
				.filter(source => source.hasCDM)
				.map(source => _.clone(source))
				.forEach(source => {
					source.breakdown = ko.observable({});
					source.cf = ko.observable({});
					source.facets = ko.observableArray([]);
					source.filtersChanged = ko.observable();
					source.filteredRecs = ko.observable([]);
					source.someMembers = ko.observableArray([]);
					source.membersChosen = ko.observable('');
					source.fetchMax = ko.observable(self.defaultFetchMax);
					self.sources.push(source);
					$.ajax({
						url: params.services.url + source.sourceKey + '/cohortresults/' + params.model.currentCohortDefinition().id() + '/breakdown',
						method: 'GET',
                        headers: {
                            Authorization: authApi.getAuthorizationHeader()
                        },
						contentType: 'application/json',
						success: function (breakdown) {
							let cf = crossfilter(breakdown);
							source.breakdown(breakdown);
							source.cf(cf);
							source.facets.push(..._.map(dimConfig, function (dc, dimKey) {
								let dim = _.clone(dc);
								dim.key = dimKey;
								dim.Members = [];
								dim.cfdim = cf.dimension(dim.func);
								dim.filter = ko.observable(null);
								dim.filter.subscribe(filter => {
									dim.cfdim.filter(filter);
									source.filtersChanged(filter);
								});
								dim.group = dim.cfdim.group();
								dim.group.reduceSum(d => d.people);
								dim.groupAll = dim.cfdim.groupAll();
								dim.groupAll.reduceSum(d => d.people);
								dim.countFunc = group => group.value;
								return dim;
							}));
							source.groupAll = source.cf().groupAll();
							source.groupAll.reduceSum(d => d.people);
							source.filtersChanged.subscribe(() => {
								source.filteredRecs(source.groupAll.value());
							});
							source.filteredRecs.subscribe(function () {
								source.someMembers.removeAll();
								source.membersChosen(source.groupAll.value() + ' people in cohort matching:');
								let genders = source.facets()[0].Members.filter(d => d.Selected);
								let gender = genders.length ?
									genders.map(d => `'${d.Name}'`).join(',') : "''";
								let ages = source.facets()[1].Members.filter(d => d.Selected);
								let age = ages.length ?
									ages.map(d => `'${d.Name}'`).join(',') : "''";
								let conditionss = source.facets()[2].Members.filter(d => d.Selected);
								let conditions = conditionss.length ?
									conditionss.map(d => d.Name).join(',') : "''";
								let drugss = source.facets()[3].Members.filter(d => d.Selected);
								let drugs = drugss.length ?
									drugss.map(d => d.Name).join(',') : "''";
								let url = params.services.url + source.sourceKey + '/cohortresults/' + params.model.currentCohortDefinition().id() + '/breakdown/' + gender + '/' + age + '/' + conditions + '/' + drugs + '/' + 100; // max number of cohort people to retrieve
								$.ajax({
									url: url,
									method: 'GET',
									contentType: 'application/json',
									success: function (people) {
										people.forEach(function (person) {
											//person.url = '#/profiles/' + source.sourceKey + '/' + params.model.currentCohortDefinition().id() + '/' + person.personId;
											person.url = '#/profiles';
										});
										source.someMembers.removeAll();
										source.someMembers.push(...people);
										source.fetchMax(Math.min(self.defaultFetchMax, people.length));
									}
								});
							});
							source.filteredRecs(source.breakdown())
						}
					});
				});

			self.viewProfile = function(person) {
				//console.log(person);
				util.setState('currentCohortDefinitionId', params.model.currentCohortDefinition().id());
				util.setState('personId', person.personId);
				location.hash = '#/profiles?' + location.hash.replace(/^.*\?/,'');
				//return true;
			};
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
			self.columns = [
				{
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
