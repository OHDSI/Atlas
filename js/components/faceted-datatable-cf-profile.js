"use strict";
define(['knockout', 'text!./faceted-datatable-cf-profile.html', 'databindings', 'colvis'], function (ko, view) {

	function facetedDatatableProfile(params) {
		window.ko = ko;
		var self = this;

		self.recs = params.recs;
		self.data = ko.observableArray();
		self.data(self.recs());
		self.facets = params.facets;

		self.options = params.options;
		self.columns = params.columns;
		self.rowCallback = params.rowCallback;
		self.rowClick = params.rowClick;
		self.facetsOnly = params.facetsOnly;

        // Set some defaults for the data table
		self.autoWidth = params.autoWidth || true;
		self.buttons = params.buttons || [
				'colvis', 'copyHtml5','excelHtml5','csvHtml5','pdfHtml5'
		];
		self.colVis = params.colVis || {
						buttonText: ko.i18n('datatable.language.buttons.changeColumns', 'Change Columns'),
						align: 'right',
						overlayFade: 0,
						showAll: ko.i18n('datatable.language.buttons.showAllColumns', 'Show All Columns'),
						restore: ko.i18n('datatable.language.buttons.resetColumns', 'Reset Columns')
					};
		self.dom = params.dom || 'Blfiprt';
		self.language = params.language || {
						search: 'Filter: '
					};
		self.lengthMenu = params.lengthMenu || [[15, 30, 45, -1], [15, 30, 45,'All']];
		self.order = params.order || [[1,'desc']];
		self.orderClasses = params.orderClasses || false;
		self.ordering = params.ordering || true;

		self.searchFilter = params.searchFilter;
		self.initCompleteCallback = function() {
			var dt=$('#profile-manager-table table').DataTable();
			dt.on('search.dt', function(e, settings) { 
				var s = dt.search();
				if (s.length === 0) {
					self.searchFilter(null);
					return ()=>false;
				}
				self.searchFilter(rec => {
					return _.chain(rec).values().compact().some(val => val.toString().match(new RegExp(s,'i'))).value();
				})
				return true;
			});
		};

		self.recs.subscribe(function () {
			facetSetup();
		});
		facetSetup();
		function facetSetup() {
			var newFacets = [];
			self.facets().forEach(facet=>{
				var members = [];
				facet.group.all().forEach(group=>{
					var oldMember = _.find(facet.Members,{Name:group.key});
					var member = {
						Name: group.key,
						ActiveCount: facet.countFunc ? facet.countFunc(group) : group.value.length,
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
		}

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
		viewModel: facetedDatatableProfile,
		template: view
	};

	ko.components.register('faceted-datatable-cf-profile', component);
	return component;
});
