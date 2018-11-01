define(['knockout', 'bootstrap-datetimepicker'], function(ko) {
	ko.bindingHandlers.dateTimePicker = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			//initialize datepicker with some optional options
			const options = allBindingsAccessor().dateTimePickerOptions || {};
			$(element).datetimepicker(options);

			//when a user changes the date, update the view model
			ko.utils.registerEventHandler(element, "dp.change", function (event) {
				const value = valueAccessor();
				if (ko.isObservable(value)) {
					if (event.date != null && !(event.date instanceof Date)) {
						value(event.date.toDate());
					} else {
						value(event.date);
					}
				}
			});

			ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
				const picker = $(element).data("DateTimePicker");
				if (picker) {
					picker.destroy();
				}
			});
		},
		update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {

			const picker = $(element).data("DateTimePicker");
			//when the view model is updated, update the widget
			if (picker) {
				let koDate = ko.utils.unwrapObservable(valueAccessor());

				//in case return from server datetime i am get in this form for example /Date(93989393)/ then fomat this
				koDate = (typeof (koDate) !== 'object') ? new Date(parseFloat(koDate)) : koDate;

				picker.date(koDate);
			}
		}
	};
});