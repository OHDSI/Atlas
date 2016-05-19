"use strict";
define(['knockout', 'text!./faceted-datatable-cf.html', 'crossfilter/crossfilter','knockout-mapping','knockout.dataTables.binding', 'colvis'], function (ko, view, facetEngine, crossfilter,mapping) {

	function facetedDatatable(params) {
		window.ko = ko;
		window.mapping = mapping;
		var self = this;

		self.crossfilter = params.crossfilter;
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

		//self.facetEngine = ko.observable();
		 var reduceToRecs = [ (p,v,nf)=>p.concat(v), (p,v,nf)=>_.without(p,v), ()=>[] ];

		self.recs.subscribe(function () {
			console.log('new recs for datatable');
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
			//self.facets(params.facets);

			//console.log(self.facets());
			/*
			var groupAll = self.crossfilter().groupAll();
			groupAll.reduce(...reduceToRecs);
			self.data(groupAll.value());
			*/
			self.data(self.recs());
			return;
			var fe = new facetEngine(params.facets);

			for (var i = 0; i < self.recs().length; i++) {
				fe.Process(self.recs()[i]);
			}
			fe.MemberSortFunction = function () {
				return this.ActiveCount
			};
			fe.sortFacetMembers();

			//self.facetEngine(fe);
			self.data(self.recs());
		});

		self.updateFilters = function (data, event) {
			//$(event.target).closest('.facetMemberName').toggleClass('selected');
			var context = ko.contextFor(event.target);
			context.$data.Selected = !context.$data.Selected;
			var facet = context.$parent;
			var selected = facet.Members
												.filter(d=>d.Selected)
												.map(d=>d.Name);
			console.log(facet, selected);
			if (selected.length === 0) {
				facet.Members.forEach(member=>{
					member.Selected = false;
				});
				facet.filter(null);
			} else {
				facet.filter(d=>selected.indexOf(d) != -1);
			}
			var facetIndex = ko.contextFor(event.target.parentElement.parentElement).$index();
			self.facets.splice(facetIndex, 1);
			self.facets.splice(facetIndex, 0, facet);
			//self.facets.valueHasMutated();
			//self.facets(self.facets());
			//self.facetEngine().SetFilter(filters);
			//self.facetEngine(self.facetEngine());
			//self.data(self.facetEngine().GetCurrentObjects());
		};

	};

	var component = {
		viewModel: facetedDatatable,
		template: view
	};

	ko.components.register('faceted-datatable-cf', component);
	return component;
});
