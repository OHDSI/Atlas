define(['jquery', 'knockout', './datatableBinding'], function($,ko) {
	// re-wire update on binding to rebuild table
	ko.bindingHandlers.dynamicDataTable = {
		init: ko.bindingHandlers.dataTable.init,
		update: (element, valueAccessor) => {
			var table = $(element).DataTable();
			table.destroy();
			$(element).empty();
			$(element).DataTable(Object.assign({}, valueAccessor().options, {
				language: ko.unwrap(valueAccessor().options.language)
			}));
			ko.bindingHandlers.dataTable.update(element, valueAccessor);
		}
	}
});
