define(['knockout', 'text!./profile-manager.html', 'd3', 'appConfig', 'lodash', 'supergroup/supergroup','d3_tip', 'knockout.dataTables.binding', 'faceted-datatable','components/profileChart', 'css!./styles/profileManager.css'], function (ko, view, d3, config, lodash, _) {

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

		i don't want to make significant changes to facetedDatatable because it's used elsewhere.
			it can currently receive an observable (of all records it should know about, so, all records
			after other filters have been applied), and it can set an observable to records remaining
			after applying facet engine. it cannot yet communicate anything about text search filtering.

		a filterManager should provide each component with the set of records left after applying
			all filters except its own. this requires that each component be able to supply the set
			of records that it filters OUT.
			when a component changes its filter, the other components need to be updated, but they
			should not trigger further updates. how can I do this?

		highlights (is this right?) should not be cumulative the way hide filters are. when a component
			triggers a highlight, any previous highlights should be removed.

		datatable input recs: filterManager.recs['datatable'] : recs left after applying all but datatable's filters
	*/
	function filterManager(self) {
		console.log('in filterManager with' , self.allRecs().length);
		self.components.forEach(function(comp) {
			self[comp + '_recs'](self.allRecs());
			self[comp + '_filteredIn'](self.allRecs());
			self[comp + '_filteredOut']([]);
			self[comp + '_ownFilter']();
		});
	}
	function applyFiltersToComponent(self, comp) {
		var recsToFilterOut = [];
		self.components.forEach(function(otherComp) {
			if (otherComp === comp) return;
			recsToFilterOut = recsToFilterOut.concat(_.difference(self[otherComp + '_recs'](), self[otherComp + '_filteredOut']()));
		});
		if (_.difference(self[comp + '_recs'](), recsToFilterOut).length === 0) {
			// nothing additional to filter out
			return;
		}
		console.log(`applying filters to ${comp}, prior: ${self[comp + '_recs']().length}, new: ${recsToFilterOut.length}`);
		self[comp + '_recs'](recsToFilterOut);
	}

	function profileManager(params) {
		window.d3 = d3;
		window.ko = ko;
		window._ = _;
		var self = this;
		window.profileManager = self;
		self.config = config;
		self.services = [params.services];
		self.allRecs = ko.observableArray([]);
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

		self.components = ['datatable','profileChart'];
		self.components.forEach(function(comp) {
			self[comp + '_recs']	  = ko.observableArray([]);
			self[comp + '_filteredOut'] = ko.observableArray([]);
			self[comp + '_filteredIn'] = ko.observableArray([]);
			self[comp + '_ownFilter'] = ko.observable();
		});
		filterManager(self, []);
		self.components.forEach(function(comp) {
			self[comp + '_filteredOut'].subscribe(function(recs) { 	// when comp changes its filter, change recs for other comps if filter affects them
				console.log(`set filter out on ${comp} for ${recs.length} recs`);
				self.components.forEach(function(otherComp) {
					if (otherComp === comp) return;
					console.log('apply filter to ' + otherComp);
					applyFiltersToComponent(self, otherComp);
				});
			});
			self[comp + '_filteredIn'].subscribe(function(recs) {
				console.log(`set filter in on ${comp} for ${recs.length} recs`);
				self[comp + '_filteredOut'](_.difference(self.allRecs(), recs));
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
					self.allRecs(profile.records);
					self.loadedProfile(profile);
					filterManager(self);
				}
			});
		};

		self.showBrowser = function () {
			$('#cohortDefinitionChooser').modal('show');
		};

		self.cohortDefinitionButtonText = ko.observable('Click Here to Select a Cohort');

		self.options = {
			Facets: [
				{
					'caption': 'Type',
					'binding': function (o) {
						return o.domain;
					}
				},
				{
					'caption': 'Year Start',
					'binding': function (o) {
						return new Date(o.startDate).getFullYear();
					}
				}
			]
		};

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
