define(['knockout', 'text!./faceted-datatable.html', 'crossfilter', 'colvis', ], function (ko, view, crossfilter) {

	function facetedDatatable(params) {
		var self = this;

		self.reference = params.reference || [];
		self.facetReference = params.facetReference || [];
		self.serverSide = params.serverSide || false;
		self.ajax = params.ajax || undefined;
		self.processing = params.processing || false;
		self.classes = params.classes || {};
		self.data = params.xfObservable || ko.observable();
		self.tableData = !self.serverSide ? ko.pureComputed(function () {
			if (self.data() && self.data().size() && self.data().size() > 0) {
				return self.data().allFiltered();
			} else {
				return [];
			}
		}) : null;
		self.componentLoading = ko.observable(true);
		self.facets = ko.observableArray();
		self.dtApi = ko.observable();
		self.filterCallback = params.filterCallback;

		self.nullFacetLabel = params.nullFacetLabel || 'NULL';
		self.options = params.options;
		self.columns = params.columns;
		self.rowCallback = params.rowCallback || function () {};
		self.rowClick = params.rowClick;
		self.drawCallback = params.drawCallback;

		// Set some defaults for the data table
		self.autoWidth = params.autoWidth || true;
		self.buttons = params.buttons || [
			'colvis', 'copyHtml5', 'excelHtml5', 'csvHtml5', 'pdfHtml5'
		];
		self.colVis = params.colVis || {
			buttonText: 'Change Columns',
			align: 'right',
			overlayFade: 0,
			showAll: 'Show All Columns',
			restore: 'Reset Columns'
		};
		self.deferRender = params.deferRender || true;
		self.dom = params.dom || '<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>><rt><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>';
		self.language = params.language || {
			search: 'Filter: '
		};
		self.pageLength = params.pageLength || 15;
		self.lengthMenu = params.lengthMenu || [
			[15, 30, 45, 100, -1],
			[15, 30, 45, 100, 'All']
		];
		self.order = params.order || [
			[1, 'desc']
		];
		self.orderColumn = 1;
		if (params.orderColumn) {
			self.order = [
				[params.orderColumn, 'desc']
			]
		}
		self.orderClasses = params.orderClasses || false;
		self.ordering = params.ordering || true;
		self.scrollOptions = params.scrollOptions || null;

		self.updateFilters = function (data, event) {
			var facet = data.facet;
			data.selected(!data.selected());
			if (data.selected()) {
				if (!facet.selectedItems.hasOwnProperty(data.key)) {
					facet.selectedItems[data.key] = data;
				}
			} else {
				delete facet.selectedItems[data.key];
			}
			var filter = [];
			$.each(facet.selectedItems, function (i, n) {
				filter.push(n.key);
			});
			if (filter.length <= 0) {
				facet.dimension.filterAll();
			} else {
				facet.dimension.filter(function (d) {
					return filter.indexOf(d) > -1;
				});
			}
			self.data.valueHasMutated();
		}

		// additional helper function to help with crossfilter-ing dimensions that contain nulls
		self.facetDimensionHelper = function facetDimensionHelper(val) {
			var ret = val === null ? self.nullFacetLabel : val;
			return ret;
		}

		if (typeof self.reference === 'function') {
			self.reference.subscribe(function (newValue) {
				if (self.reference() != null) {
					self.componentLoading(true);
					self.data(new crossfilter(self.reference()));
					self.facets.removeAll();
					if (self.options && self.options.Facets) {
						// Iterate over the facets and set the dimensions
						$.each(self.options.Facets, function (i, facetConfig) {
							var isArray = facetConfig.isArray || false;
							var dimension = self.data().dimension(function (d) {
								return self.facetDimensionHelper(facetConfig.binding(d));
							}, isArray);
							var facet = {
								'caption': facetConfig.caption,
								'binding': facetConfig.binding,
								'dimension': dimension,
								'facetItems': [],
								'selectedItems': new Object(),
							};
							// Add a selected observable to each dimension
							$.each(dimension.group().top(Number.POSITIVE_INFINITY), function (i, facetItem) {
								facetItem.dimension = dimension;
								facetItem.selected = ko.observable(false);
								facetItem.facet = facet;
								facet.facetItems.push(facetItem);
							});
							self.facets.push(facet);
						});
						// Iterate over the facets and set any defaults
						$.each(self.options.Facets, function (i, facetConfig) {
							if (facetConfig.defaultFacets && facetConfig.defaultFacets.length > 0) {
								$.each(facetConfig.defaultFacets, function (d, defaultFacet) {
									var facetItem = $.grep(self.facets()[i].facetItems, function (f) {
										return f.key == defaultFacet;
									});
									if (facetItem.length > 0) {
										self.updateFilters(facetItem[0], null);
									}
								})
							}
						});
					}
					self.componentLoading(false);
				}
			});
		}

		function createFacet(facetConfig) {
		  const facet = {
				caption: facetConfig.caption,
				binding: facetConfig.binding,
				field: facetConfig.field,
				dimension: {
					filterAll: () => {
						if (typeof self.filterCallback === 'function') {
							self.filterCallback({
								facet,
								filtered: [],
							});
						}
						if (self.dtApi()) {
							self.dtApi().ajaxReload();
						}
					},
					filter: (d) => {
						const filtered = facet.facetItems.filter(item => d(item.key));
						if (typeof self.filterCallback === 'function') {
							self.filterCallback({
								facet,
								filtered,
							});
						}
						if (self.dtApi()) {
							self.dtApi().ajaxReload();
						}
					},
				},
				facetItems: [],
				selectedItems: new Object(),
			};
		  return facet;
		}

		if (typeof self.facetReference === 'function') {
			self.componentLoading(true);
			self.facetReference().then(facetResponse => {
				self.facets.removeAll();
				if (self.options && self.options.Facets) {
					const facets = self.options.Facets.map(facetConfig => {
						const facet = createFacet(facetConfig);
						const facetValues = facetResponse.facets[facetConfig.field] || [];
						facet.facetItems = facetValues.map(item => ({
							key: item.value,
							value: item.count,
							selected: ko.observable(false),
							facet: facet,
						})).sort((a,b) => b.value - a.value);
						return facet;
					});
					self.facets(facets);
				}
				self.componentLoading(false);
			});
			if (self.options && self.options.Facets) {
				const facets = self.options.Facets.map(fc => createFacet(fc));
				self.facets(facets);
			}
		}

		if (typeof self.reference === 'function') {
			self.reference.valueHasMutated(); // init component
		} else {
			self.componentLoading(false);
		}
	};

	var component = {
		viewModel: facetedDatatable,
		template: view
	};

	ko.components.register('faceted-datatable', component);
	return component;
});
