define(['knockout', 'text!./faceted-datatable.html', 'facets', 'crossfilter/crossfilter','knockout.dataTables.binding', 'colvis'], function (ko, view, facetEngine, crossfilter) {

	function facetedDatatable(params) {
		var self = this;

		if (Array.isArray(params.reference))
			self.crossfilter = crossfilter(params.reference);
		else if ('dimension' in params.reference)
			self.crossfilter = params.reference;
		self.reference = params.reference;
		self.data = ko.observableArray();
		self.data(self.reference());

		self.options = params.options;
		self.columns = params.columns;
		self.rowCallback = params.rowCallback;
		self.rowClick = params.rowClick;

		self.orderColumn = 1;
		if (params.orderColumn) {
			self.orderColumn = params.orderColumn;
		}

		self.facetEngine = ko.observable();

		self.updateFilters = function (data, event) {
			$(event.target).closest('.facetMemberName').toggleClass('selected');

			var filters = [];
			$(event.target).closest('.feFilter').find('.facetMemberName.selected span').each(function (i, d) {
				filters.push(d.id);
			});

			self.facetEngine().SetFilter(filters);
			self.facetEngine(self.facetEngine());
			self.data(self.facetEngine().GetCurrentObjects());
		};

		self.reference.subscribe(function () {
			self.feTemp = new facetEngine(self.options);

			for (var i = 0; i < self.reference().length; i++) {
				self.feTemp.Process(self.reference()[i]);
			}
			self.feTemp.MemberSortFunction = function () {
				return this.ActiveCount
			};
			self.feTemp.sortFacetMembers();

			self.facetEngine(self.feTemp);
			self.data(self.reference());
		});

	};

	var component = {
		viewModel: facetedDatatable,
		template: view
	};

	ko.components.register('faceted-datatable', component);
	return component;
});
