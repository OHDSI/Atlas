define(
    (require, exports) => {
  
    var options = {};
    options.removeButton = `<button type="button" class="btn btn-danger btn-xs btn-remove"><i class="fa fa-times" aria-hidden="true"></i></button>`;

    options.cca = {
        comparisonTableColumns: [
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
                title: 'Target Id',
                data: d => d.target().id,
                visible: false,
            },
            {
                title: 'Target',
                data: d => d.target().name,
            },
            {
                title: 'Comparator Id',
                data: d => d.comparator().id,
                visible: false,
            },
            {
                title: 'Comparator',
                data: d => d.comparator().name,
            },
            {
                title: 'Outcomes',
                render: (s, p, d, a, b, c) => {
                    if (d.outcomes().length > 1) {
                        var tooltipText = ""; 
                        d.outcomes().forEach((element, index) => {
                            if (index > 0) {
                                tooltipText += ("<span class=\"tooltipitem\">" + element.name + "</span>");
                            }
                        });
                        const outcomeDisplay = d.outcomes().length == 2 ? "outcome" : "outcomes";
                        return d.outcomes()[0].name + "<br/><div class=\"tool-tip\">(" + (d.outcomes().length - 1) + "+ more " + outcomeDisplay + "<span class=\"tooltiptext\">" + tooltipText + "</span>)</div>";
                    } else if (d.outcomes().length == 1) {
                        return d.outcomes()[0].name;
                    } else {
                        return 0;
                    }
                }
            },
            {
                title: 'NC Outcomes',
                data: d => d.negativeControlOutcomesConceptSet().name,
            },
            {
                title: 'Incl Covariates',
                data: d => d.includedCovariateConceptSet().length,
                visible: false,
            },
            {
                title: 'Excl Covariates',
                data: d => d.excludedCovariateConceptSet().length,
                visible: false,
            },
        ],
        comparisonTableOptions: {
            pageLength: 10,
            lengthMenu: [
                [10, 25, 50, 100, -1],
                ['10', '25', '50', '100', 'All']
            ],
            dom: '<<"row vertical-align"<"col-xs-6"l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        },
        analysisSettingsTableColumns: [
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
                title: 'Description',
                data: d => d.description(),
            },
        ],
        analysisSettingsTableOptions: {
            pageLength: 10,
            lengthMenu: [
                [10, 25, 50, 100, -1],
                ['10', '25', '50', '100', 'All']
            ],
            dom: '<<"row vertical-align"<"col-xs-6"l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        },
        fullAnalysisTableColumns: [
            {
                title: 'Target Id',
                data: d => d.targetComparatorOutcome.target.id,
                visible: false,
            },
            {
                title: 'Target Cohort Name',
                data: d => d.targetComparatorOutcome.target.name,
            },
            {
                title: 'Comparator Id',
                data: d => d.targetComparatorOutcome.comparator.id,
                visible: false,
            },
            {
                title: 'Comparator Cohort Name',
                data: d => d.targetComparatorOutcome.comparator.name,
            },
            {
                title: 'Outcomes',
                data: d => d.targetComparatorOutcome.outcome.id,
                visible: false,
            },
            {
                title: 'Outcome Cohort Name',
                data: d => d.targetComparatorOutcome.outcome.name,
            },
            {
                title: 'Analysis Name',
                data: d => d.cohortMethodAnalysis.description(),
            },
        ],
        fullAnalysisTableOptions: {        
            pageLength: 10,
            lengthMenu: [
                [10, 25, 50, 100, -1],
                ['10', '25', '50', '100', 'All']
            ],
            dom: '<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
            domNoButtons: '<<"row vertical-align"<"col-xs-6"l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
            Facets: [{
                'caption': 'Target Cohorts',
                'binding': d => d.targetComparatorOutcome.target.name,
            },
            {
                'caption': 'Comparator Cohorts',
                'binding': d => d.targetComparatorOutcome.comparator.name,
            },
            {
                'caption': 'Outcome Cohorts',
                'binding': d => d.targetComparatorOutcome.outcome.name,
            },
            {
                'caption': 'Analysis Name',
                'binding': d => d.cohortMethodAnalysis.description(),
            },
            ]
        }        
    }

    options.numberOfStrataOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    options.maxRatioOptions = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    options.dayOptions = ['0', '1', '7', '14', '21', '30', '60', '90', '120', '180', '365', '548', '730', '1095'];
    options.maxCohortSizeOptions = ['0', '1000', '5000', '10000', '50000', '100000'];
    options.maxCohortSizeForFittingOptions = ['250000', '150000', '100000', '50000', '10000', '5000', '0'];
    options.yesNoOptions = [{
		name: "Yes",
		id: true,
    }, {
		name: "No",
		id: false
    }];

	options.removeDuplicateSubjectOptions = [{
		name: "Keep All",
		id: 'keep all',
    }, {
		name: "Keep First",
		id: 'keep first'
    }, {
        name: "Remove All",
        id: 'remove all'
    }];

    options.trimOptions = [{
		name: "None",
		id: 'none',
    }, {
		name: "By Percent",
		id: 'byPercent'
    }, {
        name: "To Equipoise",
        id: 'toEquipoise'
    }];

    options.matchStratifyOptions = [{
		name: "None",
		id: 'none',
    }, {
		name: "Match on propensity score",
		id: 'matchOnPs'
    }, {
		name: "Stratify on propensity score",
		id: 'stratifyByPs'
    }];

    options.caliperScaleOptions = [{
		name: "Standardized Logit",
		id: 'standardized logit',
    }, {
		name: "Standardized",
		id: 'standardized'
    }, {
		name: "Propensity score",
		id: 'propensity score'
    }];

    options.stratificationBaseSelectionOptions = [{
		name: "All",
		id: 'all',
    }, {
		name: "Target",
		id: 'target'
    }, {
		name: "Comparator",
		id: 'comparator'
    }];

    options.outcomeModelTypeOptions = [{
		name: "Logistic regression",
		id: 'logistic',
    }, {
		name: "Poisson regression",
		id: 'poisson'
    }, {
		name: "Cox proportional hazards",
		id: 'cox'
    }];

    options.occurrenceTypeOptions = [{
		name: "All occurrences",
		id: 'all',
    }, {
		name: "First occurrence",
		id: 'first'
    }];

    options.domains = [{
		name: "Condition",
		id: 'condition',
    }, {
		name: "Drug",
		id: 'drug'
    }, {
		name: "Device",
		id: 'device'
    }, {
		name: "Measurement",
		id: 'measurement'
    }, {
		name: "Observation",
		id: 'observation'
    }, {
		name: "Procedure",
		id: 'procedure'
    }, {
		name: "Visit",
		id: 'visit'
    }];

    options.positiveControlSynthesisArgs = {
        modelType: [{
            name: "Poisson",
            id: 'poisson',
        }, {
            name: "Survival",
            id: 'survival'
        }],
        minOutcomeCountForModelOptions: ['100', '75', '50', '25', '10'],
        minOutcomeCountForInjectionOptions: ['100', '75', '50', '25', '10'],
        washoutPeriodOptions: ['0', '1', '7', '14', '21', '30', '60', '90', '120', '180', '183', '365', '548', '730', '1095'],
        dayOptions: ['0', '1', '7', '14', '21', '30', '60', '90', '120', '180', '365', '548', '730', '1095'],
        maxSubjectsForModelOptions: ['0', '1000', '5000', '10000', '50000', '100000', , '150000', '200000', '250000'],
        yesNoOptions: [{
            name: "Yes",
            id: true,
        }, {
            name: "No",
            id: false
        }],
    }

    return options;
});