define(['jquery', 'knockout', 'jquery-ui/ui/widgets/autocomplete'], function ($, ko) {
	ko.bindingHandlers.ko_autocomplete = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			var autoWidget = $(element).autocomplete(valueAccessor());
			autoWidget.focus(function (event, ui) {
				$(this).autocomplete("search", "");
			});

			$(element).on("autocompleteselect", function (event, ui) {
				const newVal = ui.item.value.trim().length == 0 ? null : ui.item.value.trim();
				if (element.tagName.toLocaleLowerCase() === 'input') {
					element.value = newVal;
					element.dispatchEvent(new Event('change'));
				} else {
					element.innerText = newVal;
				}
				$(element).blur();
				return false;
			});
		},
		update: function (element, valueAccessor, allBindingsAccessor) {
			$(element).autocomplete("option", "source", valueAccessor().source);
		}
	};
});