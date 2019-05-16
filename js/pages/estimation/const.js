define(
  (require, exports) => {
    const pageTitle = 'Estimation';
    const ko = require('knockout');
    const config = require('appConfig');
    const _ = require('lodash');
    const consts = require('const');

    const apiPaths = {
      downloadCcaAnalysisPackage: (id, name) => `estimation/${id}/download?packageName=${name}`,
      downloadResults: id => `estimation/generation/${id}/result`,
    };

    const paths = {
        root: '/estimation/cca/',
        ccaAnalysis: id => `/estimation/cca/${id}`,
        ccaAnalysisDash: id => `#${paths.ccaAnalysis(id)}`,
        createCcaAnalysis: () => '#/estimation/cca/0',
        browser: () => '#/estimation',
    };

    const estimationGenerationStatus = consts.generationStatuses;

    const conceptSetCrossReference = {
      targetComparatorOutcome: {
        targetName: "estimationAnalysisSettings.analysisSpecification.targetComparatorOutcomes",
        propertyName: {
          includedCovariateConcepts: "includedCovariateConceptIds",
          excludedCovariateConcepts: "excludedCovariateConceptIds",
        },
      },
      negativeControlOutcomes: {
        targetName: "negativeControlOutcomes",
        propertyName: "outcomeId",
      },
      analysisCovariateSettings: {
        targetName: "estimationAnalysisSettings.analysisSpecification.cohortMethodAnalysisList.getDbCohortMethodDataArgs.covariateSettings",
        propertyName: {
          includedCovariateConcepts: "includedCovariateConceptIds",
          excludedCovariateConcepts: "excludedCovariateConceptIds",
        },
      },
      positiveControlCovariateSettings: {
        targetName: "positiveControlSynthesisArgs.covariateSettings",
        propertyName: {
          includedCovariateConcepts: "includedCovariateConceptIds",
          excludedCovariateConcepts: "excludedCovariateConceptIds",
        },
      }
    };

    const getTimeAtRisk = (createStudyPopArgs) => {
        return (createStudyPopArgs.riskWindowStart() + "-" + createStudyPopArgs.riskWindowEnd() + "d<br/>(min: " + createStudyPopArgs.minDaysAtRisk() + "d)");
    };

    const options = {
      removeButton: `<button type="button" class="btn btn-danger btn-xs btn-remove"><i class="fa fa-times" aria-hidden="true"></i></button>`,
      copyButton: `<button type="button" class="btn btn-primary btn-xs btn-copy"><i class="fa fa-clone" aria-hidden="true"></i>&nbsp;Copy</button>`,
      numberOfStrataOptions: _.range(1,11).map(v => '' + v),
      maxRatioOptions: _.range(0,11).map(v => '' + v),
      dayOptions: ['0', '1', '7', '14', '21', '30', '60', '90', '120', '180', '365', '548', '730', '1095'],
      maxCohortSizeOptions: ['0', '1000', '5000', '10000', '50000', '100000'],
      maxCohortSizeForFittingOptions: ['250000', '150000', '100000', '50000', '10000', '5000', '0'],
      yesNoOptions: [{
        name: "Yes",
        id: true,
      }, {
        name: "No",
        id: false
      }],
      removeDuplicateSubjectOptions: [{
        name: "Keep All",
        id: 'keep all',
      }, {
        name: "Keep First",
        id: 'keep first'
      }, {
        name: "Remove All",
        id: 'remove all'
      }],
      trimOptions: [{
        name: "None",
        id: 'none',
      }, {
        name: "By Percent",
        id: 'byPercent'
      }, {
        name: "To Equipoise",
        id: 'toEquipoise'
      }],
      matchStratifyOptions: [{
        name: "None",
        id: 'none',
      }, {
        name: "Match on propensity score",
        id: 'matchOnPs'
      }, {
        name: "Stratify on propensity score",
        id: 'stratifyByPs'
      }],
      caliperScaleOptions: [{
        name: "Standardized Logit",
        id: 'standardized logit',
      }, {
        name: "Standardized",
        id: 'standardized'
      }, {
        name: "Propensity score",
        id: 'propensity score'
      }],
      stratificationBaseSelectionOptions: [{
        name: "All",
        id: 'all',
      }, {
        name: "Target",
        id: 'target'
      }, {
        name: "Comparator",
        id: 'comparator'
      }],
      outcomeModelTypeOptions: [{
        name: "Logistic regression",
        id: 'logistic',
      }, {
        name: "Poisson regression",
        id: 'poisson'
      }, {
        name: "Cox proportional hazards",
        id: 'cox'
      }],
      occurrenceTypeOptions: [{
        name: "All occurrences",
        id: 'all',
      }, {
        name: "First occurrence",
        id: 'first'
      }],
      domains: [{
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
      }],
      positiveControlSynthesisArgs: {
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
          maxSubjectsForModelOptions: ['0', '1000', '5000', '10000', '50000', '100000', '150000', '200000', '250000'],
          yesNoOptions: [{
              name: "Yes",
              id: true,
          }, {
              name: "No",
              id: false
          }],
      },
      cca: {
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
                        let tooltipText = "";
                        d.outcomes().forEach((element, index) => {
                        	element = ko.toJS(element);
                            if (index > 0) {
                                tooltipText += ("<span class=\"tooltipitem\">" + element.name + "</span>");
                            }
                        });
                        const outcomeDisplay = d.outcomes().length === 2 ? "outcome" : "outcomes";
                        return ko.toJS(d.outcomes()[0]).name + "<br/><div class=\"tool-tip\">(" + (d.outcomes().length - 1) + "+ more " + outcomeDisplay + "<span class=\"tooltiptext\">" + tooltipText + "</span>)</div>";
                    } else if (d.outcomes().length === 1) {
                        return ko.toJS(d.outcomes()[0]).name;
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
            {
                title: 'Copy',
                render: (s, p, d) => {
                    return options.copyButton;
                },
                orderable: false,
                searchable: false,
                className: 'col-copy',
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
            {
                title: 'Time At Risk Start',
                render: (s, p, d) => {
                    if (d.createStudyPopArgs != null) {
                        return d.createStudyPopArgs.riskWindowStart() + "d from<br/>" + consts.timeAtRiskCohortDate.find(f => f.id === d.createStudyPopArgs.addExposureDaysToStart()).name;
                    } else {
                        return '';
                    }
                }
            },
            {
              title: 'Time At Risk End',
              render: (s, p, d) => {
                    if (d.createStudyPopArgs != null) {
                        return d.createStudyPopArgs.riskWindowEnd() + "d from<br/>" + consts.timeAtRiskCohortDate.find(f => f.id === d.createStudyPopArgs.addExposureDaysToEnd()).name;
                    } else {
                        return '';
                    }
                }
            },
            {
              title: 'Minimum<br/>Time At Risk',
              render: (s, p, d) => {
                    if (d.createStudyPopArgs != null) {
                        return d.createStudyPopArgs.minDaysAtRisk() + "d";
                    } else {
                        return '';
                    }
                }
            },
          {
                title: 'Adjustment<br/>Strategy',
                render: (s, p, d) => {
                    if (d.matchOnPs()) {
                        return d.matchOnPsArgs.maxRatio() + ":1 matching";
                    } else if (d.stratifyByPs()) {
                        return "Stratification (stratum: " + d.stratifyByPsArgs.numberOfStrata() + ")";
                    } else {
                        return 'None';
                    }
                }
            },
            {
                title: 'Outcome<br/>Model',
                render: (s, p, d) => {
                    if (d.fitOutcomeModelArgs != null) {
                        return d.fitOutcomeModelArgs.modelType();
                    } else {
                        return '';
                    }
                }
            },
            {
                title: 'Copy',
                render: (s, p, d) => {
                    return options.copyButton;
                },
                orderable: false,
                searchable: false,
                className: 'col-copy',
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
            {
                title: 'Time At Risk',
                data: d => {
                    //return (d.cohortMethodAnalysis.createStudyPopArgs.riskWindowStart() + "-" + d.cohortMethodAnalysis.createStudyPopArgs.riskWindowEnd() + "d<br/>(min: " + d.cohortMethodAnalysis.createStudyPopArgs.minDaysAtRisk() + "d)");
                    return getTimeAtRisk(d.cohortMethodAnalysis.createStudyPopArgs);
                }
            },
            {
                title: 'Outcome Model',
                data: d => {
                    return d.cohortMethodAnalysis.fitOutcomeModelArgs.modelType();
                },
            }
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
    };

    return {
      pageTitle,
      apiPaths,
      estimationGenerationStatus,
      paths: paths,
      conceptSetCrossReference,
      options,
    };
  }
);