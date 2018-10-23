define(['knockout', 'jqueryui/jquery.ddslick'], function (ko) {

	function ddSlickInit(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
		var options = valueAccessor() || {};
		ddSlickSubInit(element, viewModel, bindingContext, options);
		return {
			controlsDescendantBindings: true
		};			
	}

	function ddSlickSubInit(element, viewModel, bindingContext, options) {
		var $element = $(element);

		if ($element.children().length == 0) {
			$('<div></div>').appendTo($element);
		}

		$($element.children()[0]).ddslick({
			width: options.width || 175,
			height: options.height,
			optionWidth: options.optionWidth || 400,
			data: options.actionOptions,
			selectText: options.selectText || "Select Action...",
			onSelected: function (data) {
				options.onAction(data);
				var $element = $(element);

				if ($element.children().length == 0) {
					$('<div></div>').appendTo($element);
				}

				$($element.children()[0]).ddslick('destroy');
				ddSlickSubInit(element, viewModel, bindingContext, options);
			}
		});
	}

	ko.bindingHandlers.ddSlickAction = {
		init: ddSlickInit
	};
});