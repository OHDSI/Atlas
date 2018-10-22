define(['knockout'], function (ko) {
	ko.bindingHandlers.collapsable = {
        update: function(element, valueAccessor, allBindingsAccessor) {
            const allBindings = allBindingsAccessor();
            const collapseTargetClass = ko.unwrap(allBindings.collapseTargetClass) || 'collapse';
            var collapsableContainer = null;
            if ($(element).children("." + collapseTargetClass).length > 0) {
                collapsableContainer = $(element).children("." + collapseTargetClass)[0];
            }
			if(!collapsableContainer)
			{
				console.error("Unable to setup collapsable due to no child element containing the required collapseTargetClass: " + collapseTargetClass);
				return;
            }
            const options = ko.unwrap(allBindings.collapseOptions) || {};
            if ((options.expandedClass || options.collapsabledClass) && !options.selectorClass) {
				console.error("Collapsable binding error: collapseOptions.selectorClass not set when attempting to use an expanded/collapsable class");
				return;
            }

			var value = valueAccessor();
			if (ko.utils.unwrapObservable(value)) {
                $(element).children("." + options.selectorClass).addClass(options.expandedClass);
                $(element).children("." + options.selectorClass).removeClass(options.collapsabledClass);
                $(collapsableContainer).collapse('show');
			} else {
                $(element).children("." + options.selectorClass).removeClass(options.expandedClass);
                $(element).children("." + options.selectorClass).addClass(options.collapsabledClass);
                $(collapsableContainer).collapse('hide');
            }
        }
	};

});
