define(
    (require, exports) => {
  
    var options = {};
    var ko = require('knockout');

    options.cohortTableColumns = [
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

    /*
    options.predictionTableColumns = [
        {
            title: 'Target Id',
            data: d => d.targetId(),
            visible: false,
        },
        {
            title: 'Target',
            data: d => d.targetName,
        },
        {
            title: 'Outcomes',
            data: d => d.outcomeIds().length,
        },
    ];
    */

    options.populationSettingsTableColumns = [
        {
            title: 'Binary',
            data: d => d.binary(),
            visible: false,
        },
        {
            title: 'First Exposure Only',
            data: d => d.firstExposureOnly(),
            visible: false,
        },
        {
            title: 'Risk Window Start',
            data: d => d.riskWindowStart(),
        },
        {
            title: 'Risk Window End',
            data: d => d.riskWindowEnd(),
        },
        {
            title: 'Washout Period',
            data: d => d.washoutPeriod(),
        },
        {
            title: 'Include All Outcomes',
            data: d => d.includeAllOutcomes(),
        },
        {
            title: 'Remove Subjects With Prior Outcome',
            data: d => d.removeSubjectsWithPriorOutcome(),
        },
        {
            title: 'Prior Outcome Lookback',
            data: d => d.priorOutcomeLookback(),
            visible: false,
        },
        {
            title: 'Require Time At Risk',
            data: d => d.requireTimeAtRisk(),
            visible: false,
        },
        {
            title: 'Minimum Time At Risk',
            data: d => d.minTimeAtRisk(),
        },
        {
            title: 'Add Exposure Days To Start',
            data: d => d.addExposureDaysToStart(),
            visible: false,
        },
        {
            title: 'Add Exposure Days To End',
            data: d => d.addExposureDaysToEnd(),
            visible: false,
        },
    ];

    options.modelSettingsTableColumns = [
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
            title: 'Model',
            data: d => Object.keys(d)[0],
            visible: false,
        },
        {
            title: 'Options',
            data: d => {
                //var key = Object.keys(d)[0];
                //return ko.toJSON(d[key]);
                return ko.toJSON(d);
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

    return options;
});