define(['knockout', 'jqueryui/autoGrowInput'], function (ko) {
	ko.bindingHandlers.autoGrowInput = {
		init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
			var value = valueAccessor();
			var valueUnwrapped = ko.unwrap(value);
			if (valueUnwrapped === true) {
				// use default options
				$(element).autoGrowInput();
			} else if (valueUnwrapped === false) {
				// does nothing
				return;
			} else {
				// use custom options
				$(element).autoGrowInput(valueUnwrapped);
			}

		},
		update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
			$(element).trigger('update');
		}
	};
});