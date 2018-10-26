define(['knockout', 'text!./faceted-datatable.html', 'crossfilter', 'services/http', 'appConfig', 'colvis'], function (ko, view, crossfilter, httpService, config) {

	function facetedDatatable(params) {
		const self = this;

		self.headersTemplateId = params.headersTemplateId;
		self.reference = params.reference;
		self.data = params.xfObservable || ko.observable();
		self.componentLoading = ko.observable(false);
		self.ajax = (d, callback, settings) => {
			self.componentLoading(true);
			params.ajax({
				page: d.start / d.length,
				size: d.length,
				filter: JSON.stringify(this.facets().map((f) => {
					return {
						name: f.caption,
						selectedItems: Object.keys(f.selectedItems).map(item => {
							return {
								text: f.selectedItems[item].text,
								key: f.selectedItems[item].key,
							}
						})
					}
				}))
			})
				.then(({data}) => {
					callback({
						draw: d.draw,
						recordsTotal: data.totalElements,
						recordsFiltered: data.totalElements,
						data: data.content
					});
					self.componentLoading(false);
			})
		};
		self.createFilters = () => {
			self.facets.removeAll();
			if (self.options && self.options.Facets) {
				self.options.Facets.forEach(facetConfig => {
					httpService.doGet(config.webAPIRoot + "facets?facet=" + facetConfig.caption + '&entityName=' + self.options.entityName)
						.then(({data}) => {
							// var isArray = facetConfig.isArray || false;
							let facet = {
								'caption': facetConfig.caption,
								'binding': facetConfig.binding,
								'dimension': data,
								'facetItems': [],
								'selectedItems': {},
							};
							// Add a selected observable to each dimension
							data.forEach((d) =>
								facet.facetItems.push({
									key: d.key,
									text: d.text,
									count: d.count,
									dimension: data,
									selected: ko.observable(false),
									facet: facet
								})
							);
							self.facets.push(facet);
						})
						.catch((e) => {
							console.log(e);
						})
				});
				// Iterate over the facets and set any defaults
				/*
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
				*/
			}
		};
		self.facets = ko.observableArray();

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
		self.dom = params.dom || '<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>';
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
			let facet = data.facet;
			data.selected(!data.selected());
			if (data.selected()) {
				if (!facet.selectedItems.hasOwnProperty(data.key)) {
					facet.selectedItems[data.text] = data;
				}
			} else {
				delete facet.selectedItems[data.text];
			}
			self.facets.valueHasMutated();
		};
		self.createFilters();
	};

	var component = {
		viewModel: facetedDatatable,
		template: view
	};

	ko.components.register('faceted-datatable', component);
	return component;
});
