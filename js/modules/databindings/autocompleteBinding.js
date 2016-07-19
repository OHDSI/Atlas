define(['jquery', 'knockout', 'jquery-ui'], function ($, ko) {
	ko.bindingHandlers.ko_autocomplete = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			$(element).autocomplete(valueAccessor()).focus(function (event, ui) {
				event.preventDefault();
				$(this).autocomplete("search", "");
			});
		},
		update: function (element, valueAccessor, allBindingsAccessor) {
			$(element).autocomplete("option", "source", valueAccessor().source);
		}
	};
});