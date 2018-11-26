define(['knockout', 'jquery-ui/ui/widgets/datepicker'], function (ko) {
	ko.bindingHandlers.datepicker = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			//initialize datepicker with some optional options
			var options = allBindingsAccessor().datepickerOptions || {};
			$(element).datepicker(options);

			//handle the field changing
			ko.utils.registerEventHandler(element, "change", function () {
				var observable = valueAccessor();
				observable($(element).datepicker("getDate"));
			});

			//handle disposal (if KO removes by the template binding)
			ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
				$(element).datepicker("destroy");
			});

		},
		update: function (element, valueAccessor) {
			var value = ko.utils.unwrapObservable(valueAccessor());

			//handle date data coming via json from Microsoft
			if (typeof value === "string")
			{
				if (String(value).indexOf('/Date(') == 0) {
					value = new Date(parseInt(value.replace(/\/Date\((.*?)\)\//gi, "$1")));
				}
				else
					value = new Date(value);

				// offset this timezone to UTC
				var localOffset = value.getTimezoneOffset() * 60000;
				value = new Date(value.getTime() + localOffset);
			}

			var current = $(element).datepicker("getDate");

			if (value - current !== 0) {
				$(element).datepicker("setDate", value);
			}
		}
	};
});