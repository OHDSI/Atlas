define(["knockout"], function (ko) {

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

    options.occurrenceTypeOptions = [
        {
            id: 1,
            name: ko.i18n('cc.viewEdit.design.subgroups.component.window-coeff.options.at-most', 'at most')
        },
        {
            id: 0,
            name: ko.i18n('cc.viewEdit.design.subgroups.component.window-coeff.options.exactly', 'exactly')
        },
        {
            id: 2,
            name: ko.i18n('cc.viewEdit.design.subgroups.component.window-coeff.options.at-least', 'at least')
        }
    ];

    options.windowDayOptions = new Array();
    options.windowDayOptions.push({
        label: ko.i18n('cc.viewEdit.design.subgroups.component.window-day.options.all', 'ALL'),
        value: " " // ' ' is used to work around an autocomplete issue: when it's set to null or '', the autocomplete uses the label for the value instead of value (annoying)
    });
    for (i = 0; i < options.dayOptions.length; i++) {
        options.windowDayOptions.push({
            label: options.dayOptions[i],
            value: options.dayOptions[i]
        });
    }
    options.windowCoeffOptions = [
        {
            value: -1,
            name: ko.i18n('cc.viewEdit.design.subgroups.component.window-coeff.options.before', 'Before')
        },
        {
            value: 1,
            name: ko.i18n('cc.viewEdit.design.subgroups.component.window-coeff.options.after', 'After')
        }
    ];

	options.occurrenceCountOptions = ['0','1','2','3','4','5','6','7','8','9','10','20','50','100'];
    options.groupTypeOptions = [
        {
            id: 'ALL',
            name: ko.i18n('cc.viewEdit.design.subgroups.component.group-type.options.all', 'all')
        },
        {
            id: 'ANY',
            name: ko.i18n('cc.viewEdit.design.subgroups.component.group-type.options.any', 'any')
        },
        {
            id: 'AT_LEAST',
            name: ko.i18n('cc.viewEdit.design.subgroups.component.group-type.options.at-least', 'at least')
        },
        {
            id: 'AT_MOST',
            name: ko.i18n('cc.viewEdit.design.subgroups.component.group-type.options.all', 'at most')
        }
    ];

    options.resultLimitOptions = [{
        name: ko.i18n('options.allEvents', 'all events'),
        id: "All"
		}, {
        name: ko.i18n('options.earliestEvents', 'earliest event'),
        id: "First"
		}, {
        name: ko.i18n('options.latestEvents', 'latest event'),
        id: "Last"
		}];

    options.yesNoOptions = [
        {
            id: "1",
            name: ko.i18n('cc.viewEdit.design.subgroups.component.yes-no.options.yes', 'Yes')
        },
        {
            id: "0",
            name: ko.i18n('cc.viewEdit.design.subgroups.component.yes-no.options.no', 'No')
        }
    ];


    options.DomainTypeExcludeOptions = [
        {
            name: ko.i18n('cc.viewEdit.design.subgroups.component.domain-type-exclude.options.is-any-of', 'is any of'),
            value: false
        },
        {
            name: ko.i18n('cc.viewEdit.design.subgroups.component.domain-type-exclude.options.is-not-any-of', 'is not any of'),
            value: true
        }
    ];

    options.IndexDateOptions = [
        {
            name: ko.i18n('cc.viewEdit.design.subgroups.component.index-date.options.index-start-date', 'index start date'),
            value: false
        },
        {
            name: ko.i18n('cc.viewEdit.design.subgroups.component.index-date.options.index-end-date', 'index end date'),
            value: true
        }
    ];

    options.EventDateOptions = [
        {
            name: ko.i18n('cc.viewEdit.design.subgroups.component.index-date.options.event-starts', 'event starts'),
            value: false
        },
        {
            name: ko.i18n('cc.viewEdit.design.subgroups.component.index-date.options.event-ends', 'event ends'),
            value: true
        }
    ]
	
	
    return options;
});