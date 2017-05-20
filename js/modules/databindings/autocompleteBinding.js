define(['jquery', 'knockout', 'jquery-ui'], function ($, ko) {
	ko.bindingHandlers.ko_autocomplete = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			var autoWidget = $(element).autocomplete(valueAccessor());
			autoWidget.focus(function (event, ui) {
				$(this).autocomplete("search", "");
			});

			$(element).on("autocompleteselect", function (event, ui) {
				element.innerText = ui.item.value.trim().length == 0 ? null : ui.item.value.trim();
				$(element).blur();
				return false;
			});
		},
		update: function (element, valueAccessor, allBindingsAccessor) {
			$(element).autocomplete("option", "source", valueAccessor().source);
		}
	};
});