define([
	'jquery',
	'knockout',
	'datatables.net',
	'appConfig',
	'xss',
	'moment',
	'services/MomentAPI',
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
	momentApi
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

					if (binding.options.xssSafe || column.xssSafe) return column; // disable XSS filtering if column is marked 'safe'

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

				$(element).DataTable(binding.options);

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

			// drawing may access observables, which updating we do not want to trigger a redraw to the table
			// see: https://knockoutjs.com/documentation/computed-dependency-tracking.html#IgnoringDependencies
			ko.ignoreDependencies(table.draw);
		}


	};
});
