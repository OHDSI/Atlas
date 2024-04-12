define([
	'jquery',
	'knockout',
	'datatables.net',
	'appConfig',
	'xss',
	'moment',
	'services/MomentAPI',
	'utils/CommonUtils',
	'datatables.net-buttons',
	'colvis',
	'datatables.net-buttons-html5',
	'datatables.net-select',
], function (
	$,
	ko,
	dataTables,
	config,
	filterXSS,
	moment,
	momentApi,
	commonUtils,
	) {

	function renderSelected(s, p, d) {
		return '<span class="fa fa-check-circle"></span>';
	}

	function _getTableData(element, type = 'selected')
	{
		const selector = type === 'selected' ? 'tr:has(td.select:has(span.selected))' : '';
		const selectedRows = $(element).DataTable().rows(selector, {
			'search': 'applied'
		}).data();

		var selectedData = [];
		$.each(selectedRows, function(index, value) {
			selectedData.push(value);
		});

		return selectedData;
	}

	function _getRows(element, predicate) {

		return $(element).DataTable().rows(predicate);
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

	function sortRange(x, y) {
		const xt = x.trim();
		const yt = y.trim();
		const firstNumberX = parseInt(xt.substr(0, xt.indexOf(' ')));
		const firstNumberY = parseInt(yt.substr(0, yt.indexOf(' ')));
		return firstNumberX < firstNumberY ? -1 : firstNumberX > firstNumberY ? 1 : 0;
	}

	function mapColumns(element, binding, xssOptions) {

		const columns = ko.unwrap(binding.options.columns);

		if (columns && columns[0] === 'select') {
			columns[0] = { width:'20px', orderable: false, class: 'select', render: renderSelected };
			$(element).on("click","td > span.fa.fa-check-circle", function () {
				$(this).toggleClass('selected');
			});
		}
		return columns.map((column) => {
			const originalRender = column.render;
			const originalDataAccessor = column.data;
			const hasOriginalRender = typeof originalRender === 'function';
			const hasDataAccessor = typeof originalDataAccessor === 'function';

			if (binding.options.xssSafe || column.xssSafe) { // disable XSS filtering if column is marked 'safe'
				return Object.assign({}, column, {
					title: ko.unwrap(column.title)
				});
			} else {
				return Object.assign({}, column, {
					title: ko.unwrap(column.title),
					data: hasDataAccessor
						? d => filterAbsoluteUrls(filterXSS(originalDataAccessor(d), xssOptions))
						: filterAbsoluteUrls(filterXSS(originalDataAccessor, xssOptions)),
					render: hasOriginalRender
						? (s, p, d) => filterAbsoluteUrls(filterXSS(originalRender(s, p, d), xssOptions))
						// https://datatables.net/reference/option/columns.render
						// "render" property having "string" or "object" data type is not obvious for filtering, so do not pass such things to UI for now
						: $.fn.dataTable.render.text()
				});
			}
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

			jQuery.fn.dataTableExt.oSort["range-desc"] = function(x, y) {
				return -1 * sortRange(x, y);
			};

			jQuery.fn.dataTableExt.oSort["range-asc"] = function(x, y) {
				return sortRange(x, y);
			}

			var binding = ko.utils.unwrapObservable(valueAccessor());
			// If the binding is an object with an options field,
			// initialise the dataTable with those options.
			if (binding.options) {

				const defaultTableOptions = commonUtils.getTableOptions('M')
				binding.options.pageLength = binding.options.pageLength || defaultTableOptions.pageLength;
				binding.options.lengthMenu = binding.options.lengthMenu || defaultTableOptions.lengthMenu;

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


				const xssOptions = config.xssOptions;

				const oColumns = mapColumns(element, binding, xssOptions);

				const language = binding.options.language;
				const options = Object.assign({}, binding.options, {
					columns: oColumns,
					language: ko.unwrap(language),
				});

				let selectAlls = oColumns.filter(c => c.renderSelectAll && !!c.selectAll);
				if (selectAlls.length > 0) {
					selectAlls.forEach((c, i) => {
						c.title = `<span class="select-all-${i} fa fa-check"></span> ${ko.unwrap(c.title)}`;
						$(element).on("click", "th > .select-all-" + i, (e) => {

							if (binding.data().length < 100) {
								e.target.classList.toggle('selected');
								c.selectAll($(element).DataTable().rows( { filter : 'applied'} ).data(),
									e.target.classList.contains('selected'));

							} else { // more the data - slower the all-selection/deselection. add spinner
								e.target.classList.remove('fa-check');
								e.target.classList.add('fa-circle-notch', 'fa-spin');
								setTimeout(() => {
									e.target.classList.toggle('selected');
									c.selectAll($(element).DataTable().rows( { filter : 'applied'} ).data(),
										e.target.classList.contains('selected'));
									e.target.classList.add('fa-check');
									e.target.classList.remove('fa-circle-notch', 'fa-spin');
								}, 50);
							}
						});
					});

					// todo: need to add logic for automatic select/deselect header checkbox on all items select/deselect
				}

				// For case of complex header which uses data-bindings (https://datatables.net/examples/advanced_init/complex_header.html)
				if ($(element).find('thead')[0]) {
					ko.applyBindings(bindingContext, $(element).find('thead')[0]);
				}

				let languageSubscription = null;
				let columnsSubscription = null;
				if (! $.fn.dataTable.isDataTable(element)) {
					$(element).DataTable(Object.assign({}, options));

					if (ko.isComputed(language)) {
						languageSubscription = language.subscribe((newLanguage) => {
							$(element).DataTable().clear().destroy();
							const opts = Object.assign({}, options, {
								columns: mapColumns(element, binding, xssOptions),
								language: newLanguage,
								destroy: true,
							});
							const table = $(element).DataTable(opts);
							table.rows.add(ko.unwrap(binding.data || binding));
							table.draw();
						});
					}

					// dynamic columns
					if (ko.isObservable(binding.options.columns)) {
						columnsSubscription = binding.options.columns.subscribe(() => {
							const el = $(element);
							el.DataTable().clear().destroy();

							// HTML table headers for new columns have to be built dynamically
							// https://datatables.net/forums/discussion/42893/dynamically-generating-columns
							const oldColumnsLength = options.columns.length;
							const newColumns = mapColumns(element, binding, xssOptions);
							const newColumnsLength = newColumns.length;
							const headers = el.find("thead > tr");
							for (let i = oldColumnsLength; i < newColumnsLength; i++) {
								headers.append("<th></th>");
							}

							options.columns = newColumns;
							const table = el.DataTable(options);
							table.rows.add(ko.unwrap(binding.data || binding));
							table.draw();
						});
					}
				}

				if (binding.api != null)
				{
					// expose datatable API to context's api binding.
					binding.api({
						getRows: function (predicate) { return _getRows(element, predicate); },
						getSelectedData: function() { return _getTableData(element, 'selected');},
						getFilteredData: function() { return _getTableData(element, 'filtered');},
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
					if (languageSubscription) {
						languageSubscription.dispose();
					}
					if (columnsSubscription) {
						columnsSubscription.dispose();
					}
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
			if (data && data.length > 0)
				table.rows.add(data);

			// drawing may access observables, which updating we do not want to trigger a redraw to the table
			// see: https://knockoutjs.com/documentation/computed-dependency-tracking.html#IgnoringDependencies
			ko.ignoreDependencies(table.draw);
		}


	};
});
