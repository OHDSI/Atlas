define(
    ['knockout', 'appConfig'],
    (ko, config) => {

		const WEEKDAYS = [
			{
				value: 'SUNDAY',

				long: ko.i18n('consts.weekdays.sunday.long', 'Sunday'),
				short: ko.i18n('consts.weekdays.sunday.short', 'SU')
			},
			{
				value: 'MONDAY',
				long: ko.i18n('consts.weekdays.monday.long', 'Monday'),
				short: ko.i18n('consts.weekdays.monday.short', 'MO')
			},
			{
				value: 'TUESDAY',
				long: ko.i18n('consts.weekdays.tuesday.long', 'Tuesday'),
				short: ko.i18n('consts.weekdays.tuesday.short', 'TU')
			},
			{
				value: 'WEDNESDAY',
				long: ko.i18n('consts.weekdays.wednesday.long', 'Wednesday'),
				short: ko.i18n('consts.weekdays.wednesday.short', 'WE')
			},
			{
				value: 'THURSDAY',
				long: ko.i18n('consts.weekdays.thursday.long', 'Thursday'),
				short: ko.i18n('consts.weekdays.thursday.short', 'TH')
			},
			{
				value: 'FRIDAY',
				long: ko.i18n('consts.weekdays.friday.long', 'Friday'),
				short: ko.i18n('consts.weekdays.friday.short', 'FR')
			},
			{
				value: 'SATURDAY',
				long: ko.i18n('consts.weekdays.saturday.long', 'Saturday'),
				short: ko.i18n('consts.weekdays.saturday.short', 'SA')
			},
		];

        return {
            WEEKDAYS,
        };
    });