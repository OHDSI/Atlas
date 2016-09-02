"use strict";
define(['knockout', 'text!./faceted-datatable-cf.html', 'crossfilter/crossfilter', 'lodash', 'ohdsi.util', 'knockout.dataTables.binding', 'colvis'], 
			 function (ko, view, crossfilter, _, util) {

	var reduceToRecs = [(p, v, nf) => p.concat(v), (p, v, nf) => _.without(p, v), () => []];
	function facetedDatatable(params) {
		window.ko = ko;
		var self = this;

		self.options = params.options; // passed directly to datatable binding
		self.saveState = params.saveStateToUrl;

		/*
		 * was going to allow shared crossfilter, but not for now
		self.crossfilter = ko.utils.unwrapObservable(params.crossfilter) || 
												crossfilter(self.recs);
		*/

	 /*
		self.dispatch = ko.utils.unwrapObservable(params.d3dispatch) || d3.dispatch("filter");
		if (ko.isSubscribable(params.d3dispatch)) {
			params.d3dispatch.subscribe(function(dispatch) {
				self.dispatch = dispatch;
			});
		}
		*/
		self.jqEventSpace = params.jqEventSpace || {};

		self.data = ko.observableArray([]);
		self.facets = ko.observableArray([]);

		self.rowCallback = params.rowCallback;
		self.rowClick = params.rowClick || (()=>{});

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

		// if fields parameter is supplied, columns and facets will be ignored
		if (params.fields) {
			fieldSetup(ko.utils.unwrapObservable(params.fields));
			if (ko.isSubscribable(params.fields)) {
				params.fields.subscribe(function(fields) {
					fieldSetup(fields);
				});
			}
		} else {
			if (ko.isObservable(params.columns)) {
				throw new Error("can't deal with observable columns");
			}
			self.columns = params.columns;
			self._facets = ko.utils.unwrapObservable(params.facets);
			facetSetup();
			if (ko.isSubscribable(params.facets)) {
				params.facets.subscribe(function(facets) {
					self._facets = facets;
					facetSetup();
				});
			}
		}
		function newRecs(recs) {
			self.crossfilter = crossfilter(recs);
			self.data(recs);
			//columnSetup(); // can't change after creating table
			facetSetup();
		}
		if (ko.isSubscribable(params.recs)) {
			params.recs.subscribe(function(recs) {
				newRecs(recs);
			});
		}

		columnSetup();
		newRecs(ko.utils.unwrapObservable(params.recs));

		function fieldSetup(fields) {
			self.columns = _.filter(fields, d=>d.isColumn);
			self._facets = _.filter(fields, d=>d.isFacet);
		}
		function columnSetup() {
			sharedSetup(self.columns);
			self.columns.forEach(function(column) {
				column.title = column.title || d3.functor(column.label)();
				column.render = function(data, type, row, meta) {
					// see https://datatables.net/reference/option/columns.render
					if (typeof data !== "undefined")
						return row[data];
					return column.accessor(row);
				};
			})
		}
		function facetSetup() {
			sharedSetup(self._facets);
			self._facets.forEach(function(facet) {
				facet.caption = facet.caption || d3.functor(facet.label)();
				facet.Members = [];
				facet.cfDim = self.crossfilter.dimension(facet.accessor);
				facet.cfDimGroup = facet.cfDim.group();
				facet.cfDimGroupAll = facet.cfDim.groupAll();
				facet.cfDimGroup.reduce(...reduceToRecs);
				facet.cfDimGroupAll.reduce(...reduceToRecs);
			})
			//self.facets(self._facets);
			facetUpdate();
		}
		function sharedSetup(fields) {
			fields.forEach(function(field) {
				// need to consistently define what labels and titles and stuff are called and how they're defined
				// but this is ok for now
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
		}
		function facetUpdate() {
			self._facets.forEach(facet=>{
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
			});
			self.facets.removeAll()
			self.facets.push(...self._facets);
			//self.data(self.recs());
		}

		/*
		 * PUT THIS BACK!
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
			//self.dispatch.filter(selected);
			util.setState('filters.datatable.'+facet.name, selected);
			//self.dispatch.stateChange();
			$(self.jqEventSpace).trigger('filter');
			$(self.jqEventSpace).trigger('stateChange',
								['filters.datatable.'+facet.name, selected]);
		};
		$(self.jqEventSpace).on('filter.datatable', function() {
			var groupAll = self.crossfilter.groupAll();
			groupAll.reduce(...reduceToRecs);
			self.data(groupAll.value());
			facetUpdate();
		});
	};

	var component = {
		viewModel: facetedDatatable,
		template: view
	};

	ko.components.register('faceted-datatable-cf', component);
	return component;
});
