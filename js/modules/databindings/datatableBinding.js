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
	
	ko.bindingHandlers.dataTable = {
	
		init: function (element, valueAccessor) {
			
			
			var binding = ko.utils.unwrapObservable(valueAccessor());

			// If the binding is an object with an options field,
			// initialise the dataTable with those options.
			if (binding.options) {
				// allow row level binding context
				binding.options.createdRow = function (row, data, index) {
					ko.applyBindings(data, row)
				};
				// test for 'select' column (must be first column in column definition
				if (binding.options.columns && binding.options.columns[0] == 'select') {
					binding.options.columns[0] = { width:'20px', orderable: false, class: 'select', render: renderSelected }	
					$(element).on("click","td > span.fa.fa-check-circle", function () {
						$(this).toggleClass('selected');
						console.log(this);
					});
				}
				binding.options.columns = binding.options.columns.map((column) => {
					const originalRender = column.render;
					const originalDataAccessor = column.data;
					const hasOriginalRender = typeof originalRender === 'function';
					const hasDataAccessor = typeof originalDataAccessor === 'function';
					
					return Object.assign({}, column, {
						data: hasDataAccessor
							? d => filterXSS(originalDataAccessor(d), config.xssOptions)
							: filterXSS(originalDataAccessor, config.xssOptions),
						render: hasOriginalRender
							? (s, p, d) => filterXSS(originalRender(s, p, d), config.xssOptions)
							: originalRender,
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
