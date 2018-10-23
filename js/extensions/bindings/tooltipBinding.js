define(['knockout'], function (ko) {
	ko.bindingHandlers.tooltip = {
		init: function (element, valueAccessor) {
			const value = ko.utils.unwrapObservable(valueAccessor());
			$(element).attr('data-original-title', value).bstooltip({
				html: true,
			});
		},
        update: function (element, valueAccessor) {
            const value = ko.utils.unwrapObservable(valueAccessor());
            $(element).attr('data-original-title', value);
        }
	}
});