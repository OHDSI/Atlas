define([
	'jquery',
	'knockout',
	'datatables.net',
	'appConfig',
	'xss',
	'moment',
	'services/MomentAPI',
	'utils/CommonUtils',
	'urijs',
	'datatables.net-buttons',
	'colvis',
	'datatables.net-buttons-html5',
], function (
	$,
	ko,
	dataTables,
	config,
	filterXSS,
	moment,
	momentApi,
	CommonUtils,
	URI
	) {

	function renderSelected(s, p, d) {
		return '<span class="fa fa-check-circle"></span>';
	}

	function _getSelectedData(element)
	{
		var selectedRows = $(element).DataTable().rows('tr:has(td.select:has(span.selected))', {
			'search': 'applied'
		}).data();

		var selectedData = [];
		$.each(selectedRows, function(index, value) {
			selectedData.push(value);
		});

		return selectedData;
	}

  function isUrlAbsolute(url) {
    return (url.indexOf('://') > 0 || url.indexOf('//') === 0);
  }

  function filterAbsoluteUrls(html) {
    return html.replace(/href="([^"]*)"|href='([^']*)'/g, function(match, p1, p2)
    	{
        const link = p1 || p2;
        if (isUrlAbsolute(link)) {
        	return match.replace(link, '#' + link);
        }
        return match;
      }
    );
	}

	function sortAbs(x, y) {
        const abxX = Math.abs(x);
        const absY = Math.abs(y);
        return abxX < absY ? -1 : abxX>absY ? 1 : 0;
	}

	function redrawTable(table, mode) {
		// drawing may access observables, which updating we do not want to trigger a redraw to the table
		// see: https://knockoutjs.com/documentation/computed-dependency-tracking.html#IgnoringDependencies
		const func = mode ? table.draw.bind(null, mode) : table.draw;
		ko.ignoreDependencies(func);
	}

	const PAGE_PARAM = 'dtPage';
	const SEARCH_PARAM = 'dtSearch';
	const ORDER_PARAM = 'dtOrder';
	const PARAM_SEPARATOR = '_';

	function buildDtParamName(datatable, param) {
		const elPath = CommonUtils.getPathTo(datatable.table().container());
		const elId = CommonUtils.calculateStringHash(elPath);
		return param + PARAM_SEPARATOR + elId;
	}

	function getDtParamValue(param) {
		const currentUrl = URI(document.location.href);
		const fragment = URI(currentUrl.fragment());
		const params = fragment.search(true);
		return params[param];
	}

	function setUrlParams(obj) {
		const currentUrl = URI(document.location.href);
		const fragment = URI(currentUrl.fragment());
		Object.keys(obj).forEach(k => {
			fragment.removeSearch(k).addSearch(k, obj[k]);
		});
		const updatedUrl = currentUrl.fragment(fragment.toString()).toString();
		document.location = updatedUrl;
	}

	function getPageParamName(datatable) {
		return buildDtParamName(datatable, PAGE_PARAM);
	}

	function getPageNumFromUrl(datatable) {
		return +getDtParamValue(getPageParamName(datatable));
	}

	function setPageNumToUrl(datatable, num) {
		setUrlParams({
			[getPageParamName(datatable)]: num
		});
	}

	function getSearchParamName(datatable) {
		return buildDtParamName(datatable, SEARCH_PARAM);
	}

	function getSearchFromUrl(datatable) {
		return getDtParamValue(getSearchParamName(datatable));
	}

	function setSearchToUrl(datatable, searchStr) {
		setUrlParams({
			[getSearchParamName(datatable)]: searchStr,
			[getPageParamName(datatable)]: 0
		});
	}

	function getOrderParamName(datatable) {
		return buildDtParamName(datatable, ORDER_PARAM);
	}

	function getOrderFromUrl(datatable) {
		const rawValue = getDtParamValue(getOrderParamName(datatable));
		if (!rawValue) {
			return null;
		}
		const parts = rawValue.split(',');
		return {
			column: +parts[0],
			direction: parts[1]
		};
	}

	function setOrderToUrl(datatable, column, direction) {

		setUrlParams({
			[getOrderParamName(datatable)]: column + ',' + direction,
			[getPageParamName(datatable)]: 0
		});
	}

	ko.bindingHandlers.dataTable = {

		init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {

            jQuery.fn.dataTableExt.oSort["numberAbs-desc"] = function(x, y) {
                return -1 * sortAbs(x, y);
            };

            jQuery.fn.dataTableExt.oSort["numberAbs-asc"] = function(x, y) {
                return sortAbs(x, y);
						}

			var binding = ko.utils.unwrapObservable(valueAccessor());
			// If the binding is an object with an options field,
			// initialise the dataTable with those options.
			if (binding.options) {

				// Set default placeholder for datatables search input
				const defaultPlaceholder = { searchPlaceholder: 'Search...' };
				const language = binding.options.language
					? { ...defaultPlaceholder, ...binding.options.language  }
					: defaultPlaceholder;
				binding.options.language = language;

				// allow row level binding context
				const createdRow = binding.options.createdRow;
				binding.options.createdRow = (row, data, index) => {
					if (createdRow) {
						createdRow(row, data, index);
					}
					ko.cleanNode(row);
					ko.applyBindings(bindingContext.createChildContext(data), row);
				};
				// test for 'select' column (must be first column in column definition
				const columns = binding.options.columns;

				if (columns && columns[0] == 'select') {
					columns[0] = { width:'20px', orderable: false, class: 'select', render: renderSelected };
					$(element).on("click","td > span.fa.fa-check-circle", function () {
						$(this).toggleClass('selected');
					});
				}

				const xssOptions = config.xssOptions;

				binding.options.columns = columns.map((column) => {
					const originalRender = column.render;
					const originalDataAccessor = column.data;
					const hasOriginalRender = typeof originalRender === 'function';
					const hasDataAccessor = typeof originalDataAccessor === 'function';

					// do not apply xss filtering if the table is marked safe, and the column is not marked not safe
					if (binding.options.xssSafe && column.xssSafe != false) return column; // disable XSS filtering if column is marked 'safe'

					return Object.assign({}, column, {
						data: hasDataAccessor
							? d => filterAbsoluteUrls(filterXSS(originalDataAccessor(d), xssOptions))
							: filterAbsoluteUrls(filterXSS(originalDataAccessor, xssOptions)),
						render: hasOriginalRender
							? (s, p, d) => filterAbsoluteUrls(filterXSS(originalRender(s, p, d), xssOptions))
              // https://datatables.net/reference/option/columns.render
              // "render" property having "string" or "object" data type is not obvious for filtering, so do not pass such things to UI for now
							: $.fn.dataTable.render.text()
					});
				});

				// For case of complex header which uses data-bindings (https://datatables.net/examples/advanced_init/complex_header.html)
				if ($(element).find('thead')[0]) {
					ko.applyBindings(bindingContext, $(element).find('thead')[0]);
				}

				const datatable = $(element).DataTable(binding.options);

				$(element).on('page.dt', function () {
					const info = datatable.page.info();
					setPageNumToUrl(datatable, info.page);
				});

				$(element).on('search.dt', function () {
					const currentSearchStr = getSearchFromUrl(datatable) || '';
					const newSearchStr = datatable.search();
					if (currentSearchStr !== newSearchStr) {
						setSearchToUrl(datatable, newSearchStr);
					}
				});

				$(element).on('order.dt', function () {
					const currentOrder = getOrderFromUrl(datatable);
					const newOrder = datatable.order();
					const columnIdx = newOrder[0][0];
					const orderDir = newOrder[0][1];
					if (!currentOrder || currentOrder.column !== columnIdx || currentOrder.direction !== orderDir) {
						setOrderToUrl(datatable, columnIdx, orderDir);
					}
				});

				if (binding.api != null)
				{
					// expose datatable API to context's api binding.
					binding.api({
						getSelectedData: function() { return _getSelectedData(element);}
					});
				}
				// Workaround for bug when datatable header column width is not adjusted to column values when using scrollY datatable option
				// https://stackoverflow.com/questions/32679625/jquery-datatables-header-is-not-adjusting-to-column-values-initially-but-adjust
				if (!!binding.options.scrollY) {
					setTimeout(() => 	$(element).DataTable().columns.adjust().draw('page'), 0);
				}
				// setup dispose callback:
				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					// This will be called when the element is removed by Knockout or
					// if some other part of your code calls ko.removeNode(element)
					$(element).DataTable().destroy(true);
					$(element).empty();
				});
			}

			return {
				controlsDescendantBindings: true
			};
		},
		update: function (element, valueAccessor) {
			var binding = ko.utils.unwrapObservable(valueAccessor());
			var table = $(element).DataTable();

			// assign data to either the binding's data or the actual binding.
			var data = ko.utils.unwrapObservable(binding.data || binding);

			// clear events that .on() attached to previously. Prior to this update, the binding may have specified an 'onRowClick' option, but no longer does.
			$(element).off("click","tr");

			if (binding.onRowClick != null) // attach a onRowclick handler if the options binding specifies it.
			{
				$(element).on("click","tr", function(evt)
				{
					if (this._DT_RowIndex != null)
					{
						binding.onRowClick(data[this._DT_RowIndex], evt, this, this._DT_RowIndex);
					}
				});
			}

			// Clear table
			table.clear();

			// Rebuild table from data source specified in binding
			if (data.length > 0)
				table.rows.add(data);

			const currentSearchStr = getSearchFromUrl(table);
			if (currentSearchStr) {
				table.search(currentSearchStr);
			}

			const currentOrder = getOrderFromUrl(table);
			if (currentOrder && currentOrder.column && currentOrder.direction) {
				table.order([[currentOrder.column, currentOrder.direction]]);
			}

			redrawTable(table);

			const currentPage = getPageNumFromUrl(table);
			if (currentPage) {
				table.page(currentPage);
				redrawTable(table, 'page');
			}
		}


	};
});
