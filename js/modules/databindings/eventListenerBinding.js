define(['knockout'], function (ko) {
	ko.bindingHandlers.eventListener = {
		init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
			var params = ko.utils.unwrapObservable(valueAccessor());
			if (!(params instanceof Array)) {
				params = [params];
			}
			params.forEach(function (param) {
				$(element).on(param.event, param.selector, function (event) {
					param.callback(ko.dataFor(this), ko.contextFor(this), event);
				});
			});
		}
	}
});