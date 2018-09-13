define(
    (require, exports) => {
  
    var options = {};
    var ko = require('knockout');

    options.removeButton = `<button type="button" class="btn btn-danger btn-xs btn-remove"><i class="fa fa-times" aria-hidden="true"></i></button>`;

    options.cohortTableColumns = [
        {
            title: 'Remove',
            render: function (s, p, d) {
                return options.removeButton;
            },
            orderable: false,
            searchable: false,
            className: 'col-remove',
        },
        {
            title: 'Id',
            data: d => d.id,
            visible: false,
        },
        {
            title: 'Name',
            data: d => d.name,
        },
    ];

    options.targetOutcomeTableColumns = [
        {
            title: 'Target Id',
            data: d => d.targetId,
            visible: false,
        },
        {
            title: 'Target Cohort Name',
            data: d => d.targetName,
        },
        {
            title: 'Outcome Id',
            data: d => d.outcomeId,
            visible: false,
        },
        {
            title: 'Outcome Cohort Name',
            data: d => d.outcomeName,
        },
    ];

    options.modelCovarPopTupleTableColumns = [
        {
            title: 'Model Name',
            data: d => d.modelName,
        },
        {
            title: 'Model Settings',
            data: d => d.modelSettings,
        },
        {
            title: 'Covariate Settings',
            data: d => d.covariateSettings.substring(1,30) + "...",
        },
        {
            title: 'Risk Window Start',
            data: d => d.popRiskWindowStart,
        },
        {
            title: 'Risk Window End',
            data: d => d.popRiskWindowEnd,
        },
    ]

    options.fullAnalysisTableColumns = [
        {
            title: 'Target Id',
            data: d => d.targetOutcome.targetId,
            visible: false,
        },
        {
            title: 'Target Cohort Name',
            data: d => d.targetOutcome.targetName,
        },
        {
            title: 'Outcome Id',
            data: d => d.targetOutcome.outcomeId,
            visible: false,
        },
        {
            title: 'Outcome Cohort Name',
            data: d => d.targetOutcome.outcomeName,
        },
        {
            title: 'Model Name',
            data: d => d.modelCovarPopTuple.modelName,
        },
        {
            title: 'Model Settings',
            data: d => d.modelCovarPopTuple.modelSettings,
        },
        {
            title: 'Covariate Settings',
            data: d => d.modelCovarPopTuple.covariateSettings.substring(1,30) + "...",
        },
        {
            title: 'Risk Window Start',
            data: d => d.modelCovarPopTuple.popRiskWindowStart,
        },
        {
            title: 'Risk Window End',
            data: d => d.modelCovarPopTuple.popRiskWindowEnd,
        },
    ];

    options.fullAnalysisTableOptions = {        
        pageLength: 10,
        lengthMenu: [
            [10, 25, 50, 100, -1],
            ['10', '25', '50', '100', 'All']
        ],
        dom: '<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        domNoButtons: '<<"row vertical-align"<"col-xs-6"l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        Facets: [{
            'caption': 'Target Cohorts',
            'binding': d => d.targetOutcome.targetName,
        },
        {
            'caption': 'Outcome Cohorts',
            'binding': d => d.targetOutcome.outcomeName,
        },
        {
            'caption': 'Model Name',
            'binding': d => d.modelCovarPopTuple.modelName,
        },
        {
            'caption': 'Risk Window',
            'binding': d => {
                return d.modelCovarPopTuple.popRiskWindowStart + "-" + d.modelCovarPopTuple.popRiskWindowEnd;
            },
        },
        ]
    }

    options.populationSettingsTableColumns = [
        {
            title: 'Remove',
            render: (s, p, d) => {
                return options.removeButton;
            },
            orderable: false,
            searchable: false,
            className: 'col-remove',
        },
        {
            title: 'Binary',
            data: d => d.binary().toString(),
            visible: false,
        },
        {
            title: 'First Exposure Only',
            data: d => d.firstExposureOnly().toString(),
            visible: false,
        },
        {
            title: 'Risk Window Start',
            data: d => d.riskWindowStart().toString(),
        },
        {
            title: 'Risk Window End',
            data: d => d.riskWindowEnd().toString(),
        },
        {
            title: 'Washout Period',
            data: d => d.washoutPeriod().toString(),
        },
        {
            title: 'Include All Outcomes',
            data: d => d.includeAllOutcomes().toString(),
        },
        {
            title: 'Remove Subjects With Prior Outcome',
            data: d => d.removeSubjectsWithPriorOutcome().toString(),
        },
        {
            title: 'Prior Outcome Lookback',
            data: d => d.priorOutcomeLookback().toString(),
            visible: false,
        },
        {
            title: 'Require Time At Risk',
            data: d => d.requireTimeAtRisk().toString(),
            visible: false,
        },
        {
            title: 'Minimum Time At Risk',
            data: d => d.minTimeAtRisk().toString(),
        },
        {
            title: 'Add Exposure Days To Start',
            data: d => d.addExposureDaysToStart().toString(),
            visible: false,
        },
        {
            title: 'Add Exposure Days To End',
            data: d => d.addExposureDaysToEnd().toString(),
            visible: false,
        },
    ];

    options.modelSettingsTableColumns = [
        {
            title: 'Remove',
            render: (s, p, d) => {
                return options.removeButton;
            },
            orderable: false,
            searchable: false,
            className: 'col-remove',
        },
        {
            title: 'Model',
            data: d => Object.keys(d)[0],
        },
        {
            title: 'Options',
            data: d => {
                var key = Object.keys(d)[0];
                return ko.toJSON(d[key]);
            },
        },
    ];

    options.covariateSettingsTableColumns = [
        {
            title: 'Remove',
            render: (s, p, d) => {
                return options.removeButton;
            },
            orderable: false,
            searchable: false,
            className: 'col-remove',
        },
        {
            title: 'Model',
            data: d => Object.keys(d)[0],
            visible: false,
        },
        {
            title: 'Options',
            data: d => {
                //var key = Object.keys(d)[0];
                //return ko.toJSON(d[key]);
                return ko.toJSON(d).substring(1,250) + "...";
            },
        },
    ];

    options.specificationSummaryTableOptions = {
        pageLength: 10,
        lengthMenu: [
            [10, 25, 50, 100, -1],
            ['10', '25', '50', '100', 'All']
        ],
        dom: '<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        domNoButtons: '<<"row vertical-align"<"col-xs-6"l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        //'<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>';
    };

    options.covariateSettingsTableOptions = {
        pageLength: 10,
        lengthMenu: [
            [10, 25, 50, 100, -1],
            ['10', '25', '50', '100', 'All']
        ],
        dom: '<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        domNoButtons: '<<"row vertical-align"<"col-xs-6"l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        //'<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>';
    };

	options.dayOptions = ['0', '1', '7', '14', '21', '30', '60', '90', '120', '180', '365', '548', '730', '1095'];
	options.sampleSizeOptions = ['1000', '5000', '10000', '50000', '100000'];
	options.delCovariatesSmallCount = ['5', '10', '15', '20', '25', '50', '75', '100', '150', '200', '500'];
	options.yesNoOptions = [{
		name: "Yes",
		id: true,
    }, {
		name: "No",
		id: false
    }];
    options.testSplit = [{
        name: 'time',
        desc: 'Time',
    }, {
        name: 'person',
        desc: 'Person',
    }];


    return options;
});