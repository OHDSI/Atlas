define(['knockout', 'text!./faceted-datatable.html', 'crossfilter', 'utils/CommonUtils', 'colvis',],
	function (ko, view, crossfilter, commonUtils) {

	function facetedDatatable(params) {
		var self = this;
		var subscriptions = [];

		self.dataTableId = params.dataTableId || commonUtils.getUniqueIdentifier();
		self.selectedData = params.selectedData || null;
		self.headersTemplateId = params.headersTemplateId;
		self.reference = params.reference;
		self.dtApi = params.dtApi || ko.observable();
		self.data = params.xfObservable || ko.observable();
		self.tableData = ko.pureComputed(function () {
			if (self.data() && self.data().size() && self.data().size() > 0) {
				return self.data().allFiltered();
			} else {
				return [];
			}
		});
		self.componentLoading = ko.observable(true);
		self.facets = ko.observableArray();
		
		self.nullFacetLabel = params.nullFacetLabel || 'NULL';
		self.options = params.options;
		self.oOptions = ko.unwrap(params.options);
		self.columns = params.columns;
		self.rowCallback = params.rowCallback || function () {};
		self.rowClick = params.rowClick;
		self.drawCallback = params.drawCallback;

		// Set some defaults for the data table
		self.autoWidth = params.autoWidth !== 'undefined' ? params.autoWidth : true;
		self.buttons = params.buttons || [
			'colvis',  'copyHtml5', 'excelHtml5', 'csvHtml5', 'pdfHtml5'
		];
		self.colVis = params.colVis || {
			buttonText: ko.i18n('datatable.language.buttons.changeColumns', 'Change Columns'),
			align: 'right',
			overlayFade: 0,
			showAll: ko.i18n('datatable.language.buttons.showAllColumns', 'Show All Columns'),
			restore: ko.i18n('datatable.language.buttons.resetColumns', 'Reset Columns')
		};
		self.deferRender = typeof params.deferRender != 'undefined' ? params.deferRender : true;
		self.dom = params.dom || '<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>';
		self.language = params.language || {
			search: 'Filter: '
		};
		const { pageLength, lengthMenu } = commonUtils.getTableOptions('M');
		self.pageLength = params.pageLength || pageLength;
		self.lengthMenu = params.lengthMenu || lengthMenu;
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
		self.ordering = params.ordering !== undefined ? params.ordering : true;
		self.scrollOptions = params.scrollOptions || null;
		self.createdRow = params.createdRow || null;

		self.scrollY = params.scrollY || null;
		self.scrollCollapse = params.scrollCollapse || false;

		self.outsideFilters = (params.outsideFilters || ko.observable()).extend({notify: 'always'});

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

			if (params?.updateLastSelectedMatchFilter) {
				params.updateLastSelectedMatchFilter(data.key);
			}
		}


		self.updateOutsideFilters = function (key) {
			const facets = self.facets();
			const facetItems = facets.map(facet => facet.facetItems);
			const selectedItemIndex = facetItems.findIndex(facet => facet.find(el => el.key === key));
			const selectedFacet = facets[selectedItemIndex].facetItems.find(facet => facet.key === key);

			self.updateFilters({...selectedFacet});
		};

		// additional helper function to help with crossfilter-ing dimensions that contain nulls
		self.facetDimensionHelper = function facetDimensionHelper(val) {
			var ret = val === null ? self.nullFacetLabel : val;
			return ret;
		}

		subscriptions.push(
			self.reference.subscribe(function (newValue) {
				if (self.reference() != null) {
					self.componentLoading(true);
					self.data(new crossfilter(newValue));
					self.facets.removeAll();
					if (self.oOptions && self.oOptions.Facets) {
						// Iterate over the facets and set the dimensions
						$.each(self.oOptions.Facets, function (i, facetConfig) {
							var isArray = facetConfig.isArray || false;
							var dimension = self.data().dimension(function (d) {
								return self.facetDimensionHelper(ko.unwrap(facetConfig.binding(d)));
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
						$.each(self.oOptions.Facets, function (i, facetConfig) {
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
			})
		);

		subscriptions.push(
			self.outsideFilters.subscribe(function (newValue) {
				if (self.outsideFilters() != undefined) {
					self.updateOutsideFilters(newValue);
				}
			})
		);
		// init component
		if (ko.isComputed(self.reference)) {
			// valueHasMutated doesn't work for computed
			self.reference.notifySubscribers(self.reference.peek());
		} else {
			self.reference.valueHasMutated();
		}

		self.stateSaveCallback = params.stateSaveCallback;
		self.stateLoadCallback = params.stateLoadCallback;

		self.options = {
			...self.options,
			dom: self.dom,
			colVis: self.colVis,
			language: self.language,
			buttons: self.buttons,
			rowCallback: self.rowCallback,
			lengthMenu: self.lengthMenu,
			orderClasses: self.orderClasses,
			ordering: self.ordering,
			order: self.order,
			columns: self.columns,
			autoWidth: self.autoWidth,
			deferRender: self.deferRender,
			pageLength: self.pageLength,
			drawCallback: self.drawCallback,
			createdRow: self.createdRow,
			scrollCollapse: self.scrollCollapse,
		};
		if (self.stateSaveCallback !== undefined) {
			self.options = {...self.options, stateSaveCallback: self.stateSaveCallback, stateSave: true}
		}
		if (self.stateLoadCallback !== undefined) {
			self.options = {...self.options, stateLoadCallback: self.stateLoadCallback}
		}
		if (self.scrollY) {
			self.options = { ...self.options, scrollY: self.scrollY };
		}

		self.dispose = () => {
			subscriptions.forEach(sub => sub.dispose());
		}
	};

	var component = {
		viewModel: facetedDatatable,
		template: view
	};

	ko.components.register('faceted-datatable', component);
	return component;
});
