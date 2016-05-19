define(['knockout', 'text!./profile-manager.html', 'd3', 'appConfig', 'lodash', 'crossfilter/crossfilter','d3_tip', 'knockout.dataTables.binding', 'components/faceted-datatable-cf','components/profileChart', 'css!./styles/profileManager.css'], function (ko, view, d3, config, lodash, crossfilter) {

	/*
		trying to figure out a filterManager
		several components need to be able to display data filtered by other components and also to set filters themselves:
			- datatable
				- filters set by facetEngine
				- also would like filters to be set by text search
						table.rows( { search: 'applied' } ).data()
			- timeline viz
				- main panel shows all recs (after filtering by other components)
				- brush zoom for main viz, 
				- mouseover shows local zoom area with labels (highlight?)
			- wordcloud
				- mouseover should trigger highlight--another kind of filter

		about to start trying crossfilter. stuff here is obsolete

		i don't want to make significant changes to facetedDatatable because it's used elsewhere.
			it can currently receive an observable (of all records it should know about, so, all records
			after other filters have been applied), and it can set an observable to records remaining
			after applying facet engine. it cannot yet communicate anything about text search filtering.

		a filterManager should provide each component with the set of records left after applying
			all filters except its own. the components need to display records they are filtering out
			-- like the profileChart displays the set of records it received and shows a brushing region
			over records that it's trying to filter in. 
			this requires that each component be able to supply the set
			of records that it filters OUT.
			when a component changes its filter, the other components need to be updated, but they
			should not trigger further updates. how can I do this?

		highlights (is this right?) should not be cumulative the way hide filters are. when a component
			triggers a highlight, any previous highlights should be removed.

		datatable input recs: filterManager.recs['datatable'] : recs left after applying all but datatable's filters
	*/
	/*
	function filterManager(self) {
		console.log('in filterManager with' , self.allRecs().length);

		self.profileChart_dim = self.crossfilter().dimension(d=>d.startDay);
		self.profileChart_ownFilter(self.profileChart_dim.filter);
		self.datatable_dim = self.crossfilter().dimension(d=>d);

		self.components.forEach(function(comp) {
			self[comp + '_recs'](self.allRecs());
			// move these lines below to only happen once
			self[comp + '_groupAll'](self[comp + '_dim'].groupAll());
			var groupAll = self[comp + '_groupAll']();
			groupAll.reduce((p,v,nf)=>p.concat(v), (p,v,nf)=>_.without(p,v), ()=>[]); // group's value is its records
		});
	}
	function applyFiltersToComponent(self, comp) {
		if (!self[comp + '_groupAll']()) return;
		var filteredRecs = self[comp + '_groupAll']().value(); // recs filtered by all other dimensions
		console.log(`applying filters to ${comp}, prior: ${self[comp + '_recs']().length}, new: ${filteredRecs.length}`);
		self[comp + '_recs'](filteredRecs);
	}
	*/

	function profileManager(params) {
		window.d3 = d3;
		window._ = _;
		var self = this;
		window.profileManager = self;
		self.config = config;
		self.services = [params.services];
		//self.allRecs = ko.observableArray([]);
		self.loadedProfile = ko.observable();
		//self.cohortDefinitionId = ko.observable();
		self.cohortDefinitionId = ko.observable(params.model.currentCohortDefinition().id());
		self.loadingCohort = ko.observable(false);
		self.loadingProfile = ko.observable(false);
		self.sourceKey = ko.observable(params.services.sources[0].sourceKey);
		self.sourceKey('OPTUM-PDW');
		self.startMember = 1;
		self.endMember = 10;
		self.members = ko.observableArray();
		self.personId = ko.observable();
		self.cohortPerson = ko.observable();
		self.currentMemberIndex = 0;
		self.crossfilter = ko.observable();
		self.filtersChanged = ko.observable();
		self.filteredRecs = ko.observableArray([]);
		self.facetsObs = ko.observableArray([]);

		self.dimensions = {
			'Type': {
					caption: 'Type',
					func: d => d.domain,
					filter: ko.observable(null),
					Members: [],//ko.observableArray([{Name:'foo', ActiveCount:'bar',Selected:false}]),
			},
			'Year Start': {
					caption: 'Year Start',
					func: d => new Date(d.startDate).getFullYear(),
					filter: ko.observable(null),
					Members: [],//ko.observableArray([]),
			},
			'profileChart': {
					name: 'profileChart',
					func: d => d.startDay,
					filter: ko.observable(null),
			},
			/*
			'datatable': { // this has to combine dimensions/filters from all datatable facets
				name: 'datatable',
				func: () => true,
				filter: ko.observable(null),
				//filter: ko.observable(d=>!!d),
			},
			*/
		};
		self.facets = ['Type','Year Start'].map(d=>self.dimensions[d]);
		var reduceToRecs = [ (p,v,nf)=>p.concat(v), (p,v,nf)=>_.without(p,v), ()=>[] ];
		self.crossfilter(crossfilter([]));
		_.each(self.dimensions, dim => {
			dim.filter.subscribe(filter => {
				dim.dimension.filter(filter);
				/*
				if (!_.find(self.facets, dim)) {
					dim.dimension.filter(filter);
				} else {
					self.dimensions.datatable.dimension.dispose();
					self.dimensions.datatable.dimension = self.crossfilter().dimension(
						rec => _.every(self.facets, dim => {
												if (dim.filter() == null) return true;
												return dim.filter()(dim.dimension.accessor(rec));
											})
					);
					self.dimensions.datatable.dimension.filter(d=>!!d);
				}
				*/
				self.filtersChanged(filter);
			});
			//dim.recs = ko.observable([]);
		});
		self.filtersChanged.subscribe(() => {
			var groupAll = self.crossfilter().groupAll();
			groupAll.reduce(...reduceToRecs);
			self.filteredRecs(groupAll.value());
			/*
			_.each(self.dimensions, dim => {
				dim.recs(groupAll.value());
				//dim.recs(dim.groupAll.value());
			});
			*/
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

		self.components = ['datatable','profileChart'];
		self.components.forEach(function(comp) {
			self[comp + '_recs']	  = ko.observableArray([]);
			self[comp + '_ownFilter'] = ko.observable();
			self[comp + '_groupAll'] = ko.observable();
		});
		//filterManager(self, []);
		self.components.forEach(function(comp) {
			self[comp + '_ownFilter'].subscribe(function(func) { 	// when comp changes its filter, change recs for other comps if filter affects them
				console.log(`set filter out on ${comp}: ${func}`);
				self.components.forEach(function(otherComp) {
					if (otherComp === comp) return;
					console.log('apply filter to ' + otherComp);
					//applyFiltersToComponent(self, otherComp);
				});
			});
		});

		self.hasCDM = function (source) {
			return source.hasCDM;
		}

		self.navigatePrevious = function () {
			if (self.currentMemberIndex > 0) {
				self.currentMemberIndex--;
				//self.personId(self.members()[self.currentMemberIndex].personId);
				self.personId(self.members()[self.currentMemberIndex].personId);
				self.cohortPerson(self.members()[self.currentMemberIndex]);
			} else {
				self.currentMemberIndex = self.members().length - 1;
				//self.personId(self.members()[self.currentMemberIndex].personId);
				self.personId(self.members()[self.currentMemberIndex].personId);
				self.cohortPerson(self.members()[self.currentMemberIndex]);
			}
		}

		self.navigateNext = function () {
			if (self.currentMemberIndex < self.members().length - 1) {
				self.currentMemberIndex++;
				self.personId(self.members()[self.currentMemberIndex].personId);
				self.cohortPerson(self.members()[self.currentMemberIndex]);
			} else {
				self.currentMemberIindex = 0;
				self.personId(self.members()[self.currentMemberIndex].personId);
				self.cohortPerson(self.members()[self.currentMemberIndex]);
			}
		}

		self.cohortPerson.subscribe(function (value) {
			if (value) {
				self.loadProfile(value);
			}
		});

		self.cohortDefinitionSelected = function (cohortDefinitionId) {
			self.cohortDefinitionId(cohortDefinitionId);
			$('#cohortDefinitionChooser').modal('hide');

			$.ajax({
				url: self.services[0].url + 'cohortdefinition/' + self.cohortDefinitionId(),
				method: 'GET',
				contentType: 'application/json',
				success: function (definition) {
					self.cohortDefinitionButtonText(definition.name);
				}
			});

			if (self.cohortDefinitionId() && self.sourceKey()) {
				self.loadCohort();
			}
		}

		self.sourceKey.subscribe(function () {
			if (self.cohortDefinitionId() && self.sourceKey()) {
				self.loadCohort();
			}
		});

		self.loadCohort = function () {
			$.ajax({
				url: self.services[0].url + self.sourceKey() + '/cohortresults/' + self.cohortDefinitionId() + '/members/' + self.startMember + '-' + self.endMember,
				//url: self.services[0].url + 'cohort/' + self.cohortDefinitionId(),
				method: 'GET',
				contentType: 'application/json',
				success: function (members) {
					if (members.length == 0) {
						self.personId(null);
						self.cohortPerson(null);
						self.loadingProfile(false);
						$('#modalNoMembers').modal('show');
						self.members([]);
					} else {
						self.members(members);
						// default to first person in the cohort
						self.currentMemberIndex = 0;
						//self.personId(members[self.currentMemberIndex].personId);
						self.personId(members[self.currentMemberIndex].personId);
						self.cohortPerson(members[self.currentMemberIndex]);
					}
				}
			});
		};
		self.loadCohort();

		self.loadProfile = function (cohortPerson) {
			self.loadingProfile(true);

			$.ajax({
				url: self.services[0].url + self.sourceKey() + '/person/' + cohortPerson.personId,
				method: 'GET',
				contentType: 'application/json',
				success: function (profile) {
					self.loadingProfile(false);
					profile.records.forEach(function(rec) {
						rec.startDay = Math.floor((rec.startDate - cohortPerson.startDate) / (1000 * 60 * 60 * 24))
						rec.endDay = rec.endDate ?
							Math.floor((rec.endDate - cohortPerson.startDate) / (1000 * 60 * 60 * 24))
							: rec.startDay;
					});
					//self.allRecs(profile.records);
					self.crossfilter(crossfilter(profile.records));
					self.loadedProfile(profile);
					//filterManager(self);
				}
			});
		};

		self.showBrowser = function () {
			$('#cohortDefinitionChooser').modal('show');
		};

		self.cohortDefinitionButtonText = ko.observable('Click Here to Select a Cohort');

		self.columns = [
			{
				title: 'Type',
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
			/*
			{
				title: 'From Index',
				render: (s, p, d) => {
					return (d.startDate - self.cohortPerson().startDate) / (1000 * 60 * 60 * 24)
				}
			},
			*/
			{
				title: 'Start Day',
				data: 'startDay'
			},
			{
				title: 'End Day',
				data: 'endDay'
			},
			/*
			{
				title: 'Start Date',
				render: function (s, p, d) {
					return new Date(d.startDate).toLocaleDateString();
				}
			},
			{
				title: 'End Date',
				render: function (s, p, d) {
					return new Date(d.endDate).toLocaleDateString();
				}
			}
			*/
		];
	}

	var component = {
		viewModel: profileManager,
		template: view
	};

	ko.components.register('profile-manager', component);
	return component;
});
