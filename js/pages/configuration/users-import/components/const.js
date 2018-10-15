define([
	'knockout'
],
function () {

	const WEEKDAYS = [
		{ value: 'SUNDAY', long: 'Sunday', short: 'SU' },
		{ value: 'MONDAY', long: 'Monday', short: 'MO' },
		{ value: 'TUESDAY', long: 'Tuesday', short: 'TU' },
		{ value: 'WEDNESDAY', long: 'Wednesday', short: 'WE' },
		{ value: 'THURSDAY', long: 'Thursday', short: 'TH' },
		{ value: 'FRIDAY', long: 'Friday', short: 'FR' },
		{ value: 'SATURDAY', long: 'Saturday', short: 'SA' },
	];

	return {
		WEEKDAYS,
	};
});