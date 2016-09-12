define(['knockout'], function (ko) {

	ko.bindingHandlers.htmlValue = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			ko.utils.registerEventHandler(element, "input", function () {
				var modelValue = valueAccessor();
				var elementValue = element.innerText;
				if (ko.isWriteableObservable(modelValue)) {
					modelValue(elementValue);
				} else { //handle non-observable one-way binding
					var allBindings = allBindingsAccessor();
					if (allBindings['_ko_property_writers'] && allBindings['_ko_property_writers'].htmlValue)
						allBindings['_ko_property_writers'].htmlValue(elementValue);
				}
			});
		},
		update: function (element, valueAccessor, allBindingsAccessor) {
			var value = ko.utils.unwrapObservable(valueAccessor());
			var allBindings = allBindingsAccessor();
			if ((value == null || value.length == 0) && allBindings.defaultValue)
				element.innerHTML = allBindings.defaultValue;
			else
				element.innerHTML = value;
		}
	};
});