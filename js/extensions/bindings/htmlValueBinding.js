define(['knockout', 'appConfig', 'xss'], function (ko, config, filterXSS) {
	ko.bindingHandlers.htmlValue = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			const xssOptions = config.xssOptions;
			var eventType = allBindingsAccessor().eventType || "input";
			
			ko.utils.registerEventHandler(element, eventType, function () {
				var modelValue = valueAccessor();
				var elementValue = filterXSS(element.innerText, xssOptions);
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
			
			if (element === document.activeElement) return; // element is active, so don't overwrite the html value
			
			if ((value == null || value.length == 0) && allBindings.defaultValue)
				element.innerHTML = allBindings.defaultValue;
			else
				element.innerHTML = value;
		}
	};
});