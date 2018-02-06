define([], function () {

    var options = {};

    options.dayOptions = ['0', '1', '7', '14', '21', '30', '60', '90', '120', '180', '365', '548', '730', '1095'];
    options.monthOptions = [1, 3, 6, 9, 12, 24, 36];

    options.ageOptions = new Array();
    for (i = 1; i < 100; i++) {
        options.ageOptions.push(i);
    } // intialize age options

    options.quantityOptions = new Array();
    for (i = 0; i < 100; i++) {
        options.quantityOptions.push(i);
    } // intialize quantity options

    options.occurrenceTypeOptions = [{
        id: 1,
        name: 'at most'
}, {
        id: 0,
        name: 'exactly'
}, {
        id: 2,
        name: 'at least'
}];

    options.windowDayOptions = new Array();
    options.windowDayOptions.push({
        label: "All",
        value: " " // ' ' is used to work around an autocomplete issue: when it's set to null or '', the autocomplete uses the label for the value instead of value (annoying)
    });
    for (i = 0; i < options.dayOptions.length; i++) {
        options.windowDayOptions.push({
            label: options.dayOptions[i],
            value: options.dayOptions[i]
        });
    }
    options.windowCoeffOptions = [{
        value: -1,
        name: 'Before'
}, {
        value: 1,
        name: 'After'
}];

    options.occurrenceCountOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    options.groupTypeOptions = [{
        id: 'ALL',
        name: 'all'
	}, {
        id: 'ANY',
        name: 'any'
	}, {
        id: 'AT_LEAST',
        name: 'at least'
	}, {
        id: 'AT_MOST',
        name: 'at most'
	}];

    options.resultLimitOptions = [{
        name: "all events",
        id: "All"
		}, {
        name: "earliest event",
        id: "First"
		}, {
        name: "latest event",
        id: "Last"
		}];

    options.yesNoOptions = [{
        name: "Yes",
        id: "1"
		}, {
        name: "No",
        id: "0"
		}];
		

    return options;
});