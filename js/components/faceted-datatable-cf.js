"use strict";
define(['knockout', 'text!./faceted-datatable-cf.html', 'crossfilter/crossfilter', 'lodash', 'knockout.dataTables.binding', 'colvis'], 
			 function (ko, view, crossfilter, _) {

	function facetedDatatable(params) {
		window.ko = ko;
		var self = this;

		self.recs = ko.utils.unwrapObservable(params.recs);
		self.crossfilter = ko.utils.unwrapObservable(params.crossfilter) ||
												crossfilter(self.recs);
		self.dispatch = ko.utils.unwrapObservable(params.d3dispatch) || d3.dispatch("filter");

		self.data = ko.observableArray();
		self.data(self.recs);

		self.options = params.options;
		self.fields = ko.utils.unwrapObservable(params.fields) || 
											params.columns.concat(params.facets);
		console.log(self.fields);
		self.fields.forEach(function(field) {
			// need to consistently define what labels and titles and stuff are called
			// and how they're defined
			field.label = field.label || field.fname;
			field.value = field.value || field.fname;
			field.accessor = field.value;
			if (typeof field.accessor === "string" || isFinite(field.accessor)) {
				field.accessor = d => d[field.value];
			}
			if (typeof field.accessor !== "function") {
				throw new Error("field.value must be function or string or index");
			}
		});
		self.columns = params.columns || _.filter(self.fields, d=>d.isColumn);
		self.facets = params.facets || _.filter(self.fields, d=>d.isFacet);
		var reduceToRecs = [(p, v, nf) => p.concat(v), (p, v, nf) => _.without(p, v), () => []];
		self.facets.forEach(function(facet) {
			facet.caption = facet.caption || d3.functor(facet.label)();
			facet.Members = [];
			facet.cfDim = self.crossfilter.dimension(facet.accessor);
			facet.cfDimGroup = facet.cfDim.group();
			facet.cfDimGroupAll = facet.cfDim.groupAll();
			facet.cfDimGroup.reduce(...reduceToRecs);
			facet.cfDimGroupAll.reduce(...reduceToRecs);
		})
		self.columns.forEach(function(column) {
			column.title = column.title || d3.functor(column.label)();
			column.render = function(data, type, row, meta) {
				// see https://datatables.net/reference/option/columns.render
				if (typeof data !== "undefined")
					return row[data];
				return column.accessor(row);
			};
			//column.render = typeof column.data === "string" ? (d=>d[column.data]) : column.accessor;
		})
		self.rowCallback = params.rowCallback;
		self.rowClick = params.rowClick;

		// Maybe you want to use facets for filtering, but
		// not the data table?
		self.facetsOnly = params.facetsOnly;

		// Set some defaults for the data table
		self.autoWidth = params.autoWidth || true;
		self.buttons = params.buttons || [
				'colvis','copyHtml5','excelHtml5','csvHtml5','pdfHtml5'
		];
		self.colVis = params.colVis || {
						buttonText: 'Change Columns',
						align: 'right',
						overlayFade: 0,
						showAll: 'Show All Columns',
						restore: 'Reset Columns'
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
		/*
		self.initCompleteCallback = function() {
			var dt=$('#profile-manager-table table').DataTable();
			dt.on('search.dt', function(e, settings) { 
				var s = dt.search();
				if (s.length === 0) {
					self.searchFilter(null);
					return ()=>false;
				}
				self.searchFilter(rec => {
					return _.chain(rec).values().compact().any(val => val.toString().match(new RegExp(s,'i'))).value();
				})
				return true;
			});
		};
		*/

		//self.recs.subscribe(function () {
			//facetSetup();
		//});
		facetSetup();
		function facetSetup() {
			var newFacets = [];
			self.facets.forEach(facet=>{
				var members = [];
				facet.cfDimGroup.all().forEach(group=>{
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
			//self.facets.removeAll()
			//self.facets.push(...newFacets);
			self.facets = newFacets;
			//self.data(self.recs());
		}

		self.updateFilters = function (data, event) {
			var context = ko.contextFor(event.target);
			context.$data.Selected = !context.$data.Selected;
			var facet = context.$parent;
			var selected = facet.Members
												.filter(d=>d.Selected)
												.map(d=>d.Name);
			var filter;
			if (selected.length === 0) {
				facet.Members.forEach(member=>{
					member.Selected = false;
				});
				//facet.filter(null);
				filter = null;
			} else {
				//facet.filter(d=>selected.indexOf(d) != -1);
				filter = d=>selected.indexOf(d) != -1;
			}
			facet.cfDim.filter(filter);
			self.dispatch.filter(selected);
		};
		self.dispatch.on('filter', function(filts) {
			var groupAll = self.crossfilter.groupAll();
			groupAll.reduce(...reduceToRecs);
			self.data(groupAll.value());
		});
	};

	var component = {
		viewModel: facetedDatatable,
		template: view
	};

	ko.components.register('faceted-datatable-cf', component);
	return component;
});
