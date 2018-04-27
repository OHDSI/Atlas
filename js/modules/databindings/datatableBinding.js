define(['jquery', 'knockout', 'datatables.net', 'appConfig', 'xss', 'datatables.net-buttons','datatables.net-buttons-html5'], function ($, ko, dataTables, config, filterXSS) {

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

	ko.bindingHandlers.dataTable = {
	
		init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
			
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
					columns[0] = { width:'20px', orderable: false, class: 'select', render: renderSelected }	
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
					
					return Object.assign({}, column, {
						data: hasDataAccessor
							? d => filterAbsoluteUrls(filterXSS(originalDataAccessor(d), xssOptions))
							: filterAbsoluteUrls(filterXSS(originalDataAccessor, xssOptions)),
						render: hasOriginalRender
							? (s, p, d) => filterAbsoluteUrls(filterXSS(originalRender(s, p, d), xssOptions))
              // https://datatables.net/reference/option/columns.render
              // "render" property having "string" or "object" data type is not obvious for filtering, so do not pass such things to UI for now
							: undefined
					});
				});

				$(element).DataTable(binding.options);
				
				if (binding.api != null)
				{
					// expose datatable API to context's api binding.
					binding.api({
						getSelectedData: function() { return _getSelectedData(element);}
					});
				}
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
						binding.onRowClick(data[this._DT_RowIndex], evt, this);
					}
				});
			}

			// Clear table
			table.clear();

			// Rebuild table from data source specified in binding
			if (data.length > 0)
				table.rows.add(data);
			
			table.draw();
		}
	};
});
