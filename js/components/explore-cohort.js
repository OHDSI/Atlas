define(['knockout', 'text!./explore-cohort.html', 'd3', 'appConfig', 'lodash', 'crossfilter/crossfilter', 'd3_tip', 'knockout.dataTables.binding', 'components/faceted-datatable-cf', 'css!./styles/exploreCohort.css'], 
	function (ko, view, d3, config, lodash, crossfilter) {

	/*
	*/
	function exploreCohort(params) {
		window.d3 = d3;
		window._ = _;
		var self = this;
		window.exploreCohort = self;
		self.sources = ko.observableArray([]);
		self.defaultFetchMax = 100;
		self.sourceKey = ko.observable();

		params.services.sources
			.filter(source=>source.hasCDM)
			.map(source=>_.clone(source))
			.forEach(source=>{
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
					url: params.services.url + source.sourceKey + '/cohortresults/' 
								+ params.model.currentCohortDefinition().id() + '/breakdown',
					method: 'GET',
					contentType: 'application/json',
					success: function (breakdown) {
						let cf = crossfilter(breakdown);
						source.breakdown(breakdown);
						source.cf(cf);
						source.facets.push(..._.map(dimConfig, function(dc, dimKey) {
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
							dim.group.reduceSum(d=>d.people);
							dim.groupAll = dim.cfdim.groupAll();
							dim.groupAll.reduceSum(d=>d.people);
							dim.countFunc = group => group.value;
							return dim;
						}));
						source.groupAll = source.cf().groupAll();
						source.groupAll.reduceSum(d=>d.people);
						source.filtersChanged.subscribe(() => {
							source.filteredRecs(source.groupAll.value());
						});
						source.filteredRecs.subscribe(function() {
							source.someMembers.removeAll();
							source.membersChosen(source.groupAll.value() + ' people in cohort matching:');
							let genders = source.facets()[0].Members.filter(d=>d.Selected);
							let gender = genders.length ?
														 genders.map(d=>`'${d.Name}'`).join(',')
														 : "''";
							let ages = source.facets()[1].Members.filter(d=>d.Selected);
							let age = ages.length ?
														 ages.map(d=>`'${d.Name}'`).join(',')
														 : "''";
							let conditionss = source.facets()[2].Members.filter(d=>d.Selected);
							let conditions = conditionss.length ?
														 conditionss.map(d=>d.Name).join(',')
														 : "''";
							let drugss = source.facets()[3].Members.filter(d=>d.Selected);
							let drugs = drugss.length ?
														 drugss.map(d=>d.Name).join(',')
														 : "''";
							let url = params.services.url + source.sourceKey + '/cohortresults/' 
										+ params.model.currentCohortDefinition().id() + '/breakdown/'
										+ gender + '/'
										+ age + '/'
										+ conditions + '/'
										+ drugs + '/'
										+ 100; // max number of cohort people to retrieve
							$.ajax({
								url: url,
								method: 'GET',
								contentType: 'application/json',
								success: function (people) {
									people.forEach(function(person) {
										person.url =  '/#/profiles/' 
													+ person.personId + '/'
													+ params.model.currentCohortDefinition().id() + '/'
													+ source.sourceKey;
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

		self.selectedDesc = function(facet) {
			let selected = facet.Members.filter(d=>d.Selected);
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
		return;




		self.config = config;
		self.showing = params.showing;
		self.services = params.services;
		self.model = params.model;
		self.loadingCohort = ko.observable(false);

		self.service
		debugger;

		self.sourceKey = ko.observable();
		self.cohortSource = ko.observable();
		self.cohortStart = ko.observable(1);
		self.cohortEnd = ko.observable(1);
		self.peopleToFetch = 20;
		self.cohortPeople = ko.observableArray();
		self.personId = ko.observable();
		self.person = ko.observable();
		self.cohortPerson = ko.observable();

		self.crossfilter = ko.observable();
		self.filtersChanged = ko.observable();
		self.filteredRecs = ko.observableArray([]);
		self.facetsObs = ko.observableArray([]);
		self.highlightRecs = ko.observableArray([]);
		self.highlight = function(recs, evt) {
			//console.log('highlighting ', recs.length);
			self.highlightRecs(recs || []);
		};
		self.datatableRowClickCallback = function(rec, evt) {
			console.log(arguments);
			if (evt.target.childNodes[0].data === rec.conceptName) {
				self.highlightRecs(self.filteredRecs().filter(d=>d.conceptName === rec.conceptName));
			} else {
				self.highlightRecs([rec]);
			}
		};

		self.searchHighlight = ko.observable();
		self.searchHighlight.subscribe(func=>{
			if (func)
				self.highlight(self.filteredRecs().filter(func));
			else 
				self.highlight([]);
		});
		self.facets = ['Domain'].map(d=>self.dimensions[d]);
		var reduceToRecs = [ (p,v,nf)=>p.concat(v), (p,v,nf)=>_.without(p,v), ()=>[] ];
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
			self.facets.forEach(facet=>{
				facet.Members = [];
			});
			self.facetsObs(self.facets);
			var groupAll = self.crossfilter().groupAll();
			groupAll.reduce(...reduceToRecs);
			self.filteredRecs(groupAll.value());
		});

		self.hasCDM = function (source) {
			return source.hasCDM;
		}

		self.showBrowser = function () {
			$('#cohortDefinitionChooser').modal('show');
		};

		self.cohortDefinitionButtonText = ko.observable('Click Here to Select a Cohort');

	}

	var component = {
		viewModel: exploreCohort,
		template: view
	};
	ko.components.register('explore-cohort', component);
	return component;
	function standardDeviation(values){
		var avg = average(values);

		var squareDiffs = values.map(function(value){
			var diff = value - avg;
			var sqrDiff = diff * diff;
			return sqrDiff;
		});

		var avgSquareDiff = average(squareDiffs);
	
		var stdDev = Math.sqrt(avgSquareDiff);
		return stdDev;
	}
	
	function average(data){
		var sum = data.reduce(function(sum, value){
			return sum + value;
		}, 0);
	
		var avg = sum / data.length;
		return avg;
	}
});
