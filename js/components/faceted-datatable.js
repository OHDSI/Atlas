define(['knockout', 'text!./faceted-datatable.html', 'facets', 'knockout.dataTables.binding', 'colvis'], function (ko, view, facetEngine) {

	function facetedDatatable(params) {
		var self = this;

		self.reference = params.reference;
		self.data = ko.observableArray();
		self.data(self.reference());

		self.options = params.options;
		self.columns = params.columns;
		self.rowCallback = params.rowCallback;
		self.rowClick = params.rowClick;

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
        self.orderColumn = 1;
        if (params.orderColumn) {
            self.order = [[ params.orderColumn, 'desc' ]]
		}        
		self.orderClasses = params.orderClasses || false;
		self.ordering = params.ordering || true;

		self.searchFilter = params.searchFilter;
                
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
				
		if (!self.facetEngine() && self.reference()) {
			self.reference.valueHasMutated();
		}
	};

	var component = {
		viewModel: facetedDatatable,
		template: view
	};

	ko.components.register('faceted-datatable', component);
	return component;
});