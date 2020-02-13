define([
	'knockout',
	'utils/CommonUtils',
	'urijs',
], (
	ko,
	CommonUtils,
	URI
) => {
	const PAGE_PARAM = 'dtPage';
	const SEARCH_PARAM = 'dtSearch';
	const ORDER_PARAM = 'dtOrder';
	const PARAM_SEPARATOR = '_';

	const DEFAULT_DT_PARAMS = {};
	const IGNORE_LISTENERS_FOR_DT = [];

	function getPageNumFromDt(datatable) {
		const info = datatable.page.info();
		return info.page;
	}

	function redrawTable(table, mode) {
		IGNORE_LISTENERS_FOR_DT.push(getDtId(table));

		// drawing may access observables, which updating we do not want to trigger a redraw to the table
		// see: https://knockoutjs.com/documentation/computed-dependency-tracking.html#IgnoringDependencies
		const func = mode ? table.draw.bind(null, mode) : table.draw;
		ko.ignoreDependencies(func);

		IGNORE_LISTENERS_FOR_DT.splice(IGNORE_LISTENERS_FOR_DT.indexOf(getDtId(table)), 1);
	}

	function getDtId(datatable) {
		const elPath = CommonUtils.getPathTo(datatable.table().container());
		return CommonUtils.calculateStringHash(elPath);
	}

	function buildDtParamName(datatable, param) {
		return param + PARAM_SEPARATOR + getDtId(datatable);
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

	function removeUrlParams(paramKeys) {
		const currentUrl = URI(document.location.href);
		const fragment = URI(currentUrl.fragment());
		paramKeys.forEach(k => fragment.removeSearch(k));
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

	function shouldIgnoreEvent(datatable) {
		return IGNORE_LISTENERS_FOR_DT.includes(getDtId(datatable));
	}

	function removeOrderFromUrl(datatable) {
		const paramsToRemove = [ getOrderParamName(datatable) ];
		if (getPageNumFromDt(datatable) === 0) {
			paramsToRemove.push(getPageParamName(datatable));
		}
		removeUrlParams(paramsToRemove);
	}

	function removeSearchFromUrl(datatable) {
		removeUrlParams([ getSearchParamName(datatable) ]);
	}

	function removePageNumFromUrl(datatable) {
		removeUrlParams([ getPageParamName(datatable) ]);
	}

	function applyPaginationListeners(element, datatable, binding) {
		const {defaultColumnIdx, defaultOrderDir} = binding.options && binding.options.order && (getOrderCol(binding.options.order) || getOrderDir(binding.options.order))
			? {defaultColumnIdx: getOrderCol(binding.options.order), defaultOrderDir: getOrderDir(binding.options.order)}
			: {defaultColumnIdx: 0, defaultOrderDir: 'asc'};

		DEFAULT_DT_PARAMS[getDtId(datatable)] = {
			column: defaultColumnIdx,
			direction: defaultOrderDir,
		};

		$(element).on('page.dt', function () {
			if (shouldIgnoreEvent(datatable)) return;
			const pageNum = getPageNumFromDt(datatable);
			if (getPageNumFromUrl(datatable) !== pageNum) {
				if (pageNum !== 0) {
					setPageNumToUrl(datatable, pageNum);
				} else {
					removePageNumFromUrl(datatable);
				}
			}
		});

		$(element).on('search.dt', function () {
			if (shouldIgnoreEvent(datatable)) return;
			const currentSearchStr = getSearchFromUrl(datatable) || '';
			const newSearchStr = datatable.search();
			if (currentSearchStr !== newSearchStr) {
				if (newSearchStr !== '') {
					setSearchToUrl(datatable, newSearchStr);
				} else {
					removeSearchFromUrl(datatable);
				}
			}
		});

		$(element).on('order.dt', function () {
			if (shouldIgnoreEvent(datatable)) return;

			const currentOrder = getOrderFromUrl(datatable);

			const newOrder = datatable.order();
			if (!Array.isArray(newOrder) || !newOrder.length) {
				return;
			}
			const newColumnIdx = getOrderCol(newOrder);
			const newOrderDir = getOrderDir(newOrder);

			const isOrderChanged = !currentOrder || currentOrder.column !== newColumnIdx || currentOrder.direction !== newOrderDir;
			if (isOrderChanged) {
				if (newColumnIdx !== defaultColumnIdx || newOrderDir !== defaultOrderDir) {
					setOrderToUrl(datatable, newColumnIdx, newOrderDir);
				} else {
					removeOrderFromUrl(datatable);
				}
			}
		});
	}

	function applyDtSearch(table) {
		const searchStrFromUrl = getSearchFromUrl(table) || '';
		const searchStrFromDom = table.search();
		if (searchStrFromDom !== searchStrFromUrl) {
			document.activeElement.blur(); // Otherwise text in search input is not updated
			table.search(searchStrFromUrl);
		}
	}

	function applyDtSorting(table) {
		const currentOrder = getOrderFromUrl(table) || DEFAULT_DT_PARAMS[getDtId(table)];
		table.order([[currentOrder.column, currentOrder.direction]]);
	}

	function applyDtPage(table) {
		const currentPage = getPageNumFromUrl(table) || 0;
		table.page(currentPage);
		redrawTable(table, 'page');
	}

	function refreshTable(table) {
		applyDtSearch(table);
		applyDtSorting(table);
		redrawTable(table);
		applyDtPage(table);
	}

	return {
		applyPaginationListeners,
		refreshTable,
	}
});