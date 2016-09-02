define(['jquery', 'knockout', 'jquery-ui'], function ($, ko) {
	ko.bindingHandlers.ko_autocomplete = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			var autoWidget = $(element).autocomplete(valueAccessor());
			autoWidget.focus(function (event, ui) {
				event.preventDefault();
				$(this).autocomplete("search", "");
			});

			$(element).on("autocompleteselect", function (event, ui) {
				event.preventDefault();
				if (ui.item.value.trim() != '')
					valueAccessor().value(ui.item.value);
				else
					valueAccessor().value(null);
				$(element).blur();
			});
		},
		update: function (element, valueAccessor, allBindingsAccessor) {
			$(element).autocomplete("option", "source", valueAccessor().source);
		}
	};
});