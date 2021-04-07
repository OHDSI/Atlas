define(
    ['knockout', 'appConfig'],
    (ko, config) => {

		const WEEKDAYS = [
			{
				value: 'SUNDAY',

				long: ko.i18n('const.weekdays.sunday.long', 'Sunday'),
				short: ko.i18n('const.weekdays.sunday.short', 'SU')
			},
			{
				value: 'MONDAY',
				long: ko.i18n('const.weekdays.monday.long', 'Monday'),
				short: ko.i18n('const.weekdays.monday.short', 'MO')
			},
			{
				value: 'TUESDAY',
				long: ko.i18n('const.weekdays.tuesday.long', 'Tuesday'),
				short: ko.i18n('const.weekdays.tuesday.short', 'TU')
			},
			{
				value: 'WEDNESDAY',
				long: ko.i18n('const.weekdays.wednesday.long', 'Wednesday'),
				short: ko.i18n('const.weekdays.wednesday.short', 'WE')
			},
			{
				value: 'THURSDAY',
				long: ko.i18n('const.weekdays.thursday.long', 'Thursday'),
				short: ko.i18n('const.weekdays.thursday.short', 'TH')
			},
			{
				value: 'FRIDAY',
				long: ko.i18n('const.weekdays.friday.long', 'Friday'),
				short: ko.i18n('const.weekdays.friday.short', 'FR')
			},
			{
				value: 'SATURDAY',
				long: ko.i18n('const.weekdays.saturday.long', 'Saturday'),
				short: ko.i18n('const.weekdays.saturday.short', 'SA')
			},
		];

        return {
            WEEKDAYS,
        };
    });