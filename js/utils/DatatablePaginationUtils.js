define([
	'utils/CommonUtils',
	'urijs',
], (
	CommonUtils,
	URI
) => {
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

	function getOrderCol(order) {

		return !!order[0]
			? Array.isArray(order[0]) ? order[0][0] : order[0]
			: undefined;
	}

	function getOrderDir(order) {

		return !!order[0]
			? Array.isArray(order[0]) ? order[0][1] : order[1]
			: undefined;
	}

	function applyPaginationListeners(element, datatable, binding) {
		const {defaultColumnIdx, defaultOrderDir} = binding.options && binding.options.order && (getOrderCol(binding.options.order) || getOrderDir(binding.options.order))
			? {defaultColumnIdx: getOrderCol(binding.options.order), defaultOrderDir: getOrderDir(binding.options.order)}
			: {defaultColumnIdx: 0, defaultOrderDir: 'asc'};

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
			if (!Array.isArray(newOrder) || !newOrder.length) {
				return;
			}
			const newColumnIdx = getOrderCol(newOrder);
			const newOrderDir = getOrderDir(newOrder);

			const isOrderChanged = !currentOrder || currentOrder.column !== newColumnIdx || currentOrder.direction !== newOrderDir;
			const isOrderChangedFromDefault = !(!currentOrder && newColumnIdx === defaultColumnIdx && newOrderDir === defaultOrderDir);
			if (isOrderChanged && isOrderChangedFromDefault) {
				setOrderToUrl(datatable, newColumnIdx, newOrderDir);
			}
		});
	}

	function applyDtSearch(table) {
		const currentSearchStr = getSearchFromUrl(table);
		if (currentSearchStr) {
			table.search(currentSearchStr);
		}
	}

	function applyDtSorting(table) {
		const currentOrder = getOrderFromUrl(table);
		if (currentOrder && currentOrder.column && currentOrder.direction) {
			table.order([[currentOrder.column, currentOrder.direction]]);
		}
	}

	function applyDtPage(table, redrawTable) {
		const currentPage = getPageNumFromUrl(table);
		if (currentPage) {
			table.page(currentPage);
			redrawTable(table, 'page');
		}
	}

	return {
		applyPaginationListeners,
		applyDtSearch,
		applyDtSorting,
		applyDtPage,
	}
});