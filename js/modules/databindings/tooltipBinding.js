define(['knockout'], function (ko) {
	ko.bindingHandlers.tooltip = {
		init: function (element, valueAccessor) {
			const value = ko.utils.unwrapObservable(valueAccessor());
			$(element).attr('title', '').tooltip({
				content: value
			});
		}
	}
});