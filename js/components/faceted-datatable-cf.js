"use strict";
define(['knockout', 'text!./faceted-datatable-cf.html', 'knockout.dataTables.binding', 'colvis'], function (ko, view) {

	function facetedDatatable(params) {
		window.ko = ko;
		var self = this;

		self.recs = params.recs;
		self.data = ko.observableArray();
		self.data(self.recs());
		self.facets = params.facets;
		//self.facets.extend({notify:'always'});

		self.options = params.options;
		self.columns = params.columns;
		self.rowCallback = params.rowCallback;
		self.rowClick = params.rowClick;

		self.order = params.order || [[1,'desc']];

		self.searchFilter = params.searchFilter;
		self.initCompleteCallback = function() {
			var dt=$('#profile-manager-table table').DataTable();
			dt.on('search.dt', function(e, settings) { 
				var s = dt.search();
				if (s.length === 0) {
					self.searchFilter(null);
					return;
				}
				self.searchFilter(rec => {
					return _.chain(rec).values().compact().any(val => val.toString().match(s)).value();
				})
			});
		};

		var reduceToRecs = [ (p,v,nf)=>p.concat(v), (p,v,nf)=>_.without(p,v), ()=>[] ];

		self.recs.subscribe(function () {
			var newFacets = [];
			self.facets().forEach(facet=>{
				var members = [];
				facet.group.all().forEach(group=>{
					var oldMember = _.find(facet.Members,{Name:group.key});
					var member = {
						Name: group.key,
						ActiveCount: group.value.length,
						Selected: oldMember ? oldMember.Selected : false,
					};
					members.push(member);
				});
				facet.Members = members;
				newFacets.push(facet);
			});
			self.facets.removeAll()
			self.facets.push(...newFacets);
			self.data(self.recs());
		});

		self.updateFilters = function (data, event) {
			var context = ko.contextFor(event.target);
			context.$data.Selected = !context.$data.Selected;
			var facet = context.$parent;
			var selected = facet.Members
												.filter(d=>d.Selected)
												.map(d=>d.Name);
			if (selected.length === 0) {
				facet.Members.forEach(member=>{
					member.Selected = false;
				});
				facet.filter(null);
			} else {
				facet.filter(d=>selected.indexOf(d) != -1);
			}
		};

	};

	var component = {
		viewModel: facetedDatatable,
		template: view
	};

	ko.components.register('faceted-datatable-cf', component);
	return component;
});
