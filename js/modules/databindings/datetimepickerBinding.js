/* Adds the binding datetimepicker to use with bootstra-datetimepicker http://www.malot.fr/bootstrap-datetimepicker
   Usage :
   <input type="text" data-bind="datetimepicker:birthday"/>
   <input type="text" data-bind="datetimepicker:birthday,format:'yyyy-mm-dd'"/>

 */
define(['knockout', 'bootstrap-datetimepicker'], function(ko) {
	ko.bindingHandlers.datetimepicker = {
		init: function (element, valueAccessor, allBindings) {
			//initialize datepicker with some optional options
			var format;
			var defaultFormat = 'yyyy-mm-dd hh:ii:ss'
			if (typeof allBindings == 'function') {
				format = allBindings().format || defaultFormat;
			}
			else {
				format = allBindings.get('format') || defaultFormat;
			}
			$(element).datetimepicker({
				autoclose: true,
				todayBtn: true,
				'format': format,
        fontAwesome: true,
				useCurrent: false,
				showTodayButton: true,
				sideBySide: true,
			});

			//when a user changes the date, update the view model
			ko.utils.registerEventHandler(element, "changeDate", function (event) {
				var value = valueAccessor();
				if (ko.isObservable(value)) {
					value($(element).datetimepicker("getFormattedDate"));
				}
			});
		},
		update: function (element, valueAccessor) {
			var date = ko.unwrap(valueAccessor());
			if (date) {
				$(element).datetimepicker('setValue', date);
			}
		}
	};
});