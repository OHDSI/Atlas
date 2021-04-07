define(
  (require, exports) => {
    const pageTitle = 'Estimation';
    const ko = require('knockout');
    const config = require('appConfig');
    const _ = require('lodash');
    const consts = require('const');
    const commonUtils = require('utils/CommonUtils');

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

    const isUsingRegularization = (prior) => {
      return !(prior.priorType() === "none" && prior.useCrossValidation() === false);
    }

    const setRegularization = (enable, prior) => {
      if (enable === true) {
        prior.priorType("laplace");
        prior.useCrossValidation(true);
      } else {
        prior.priorType("none");
        prior.useCrossValidation(false);
      }
    }

    const getTimeAtRisk = (createStudyPopArgs) => {
        return (createStudyPopArgs.riskWindowStart() + "-" + createStudyPopArgs.riskWindowEnd() + ko.i18n('common.daysAbbr', 'd')() +
          " (" + ko.i18n('common.min', 'min')() + ": " + createStudyPopArgs.minDaysAtRisk() +
          ko.i18n('common.daysAbbr', 'd')() + ")");
    };

    const options = {
      removeButton: `<button type="button" class="btn btn-danger btn-xs btn-remove"><i class="fa fa-times" aria-hidden="true"></i></button>`,
      copyButton: `<button type="button" class="btn btn-primary btn-xs btn-copy"><i class="fa fa-clone" aria-hidden="true"></i>&nbsp;<span data-bind="text: ko.i18n('common.copy', 'Copy')"></span></button>`,
      numberOfStrataOptions: _.range(1,11).map(v => '' + v),
      maxRatioOptions: _.range(0,11).map(v => '' + v),
      dayOptions: ['0', '1', '7', '14', '21', '30', '60', '90', '120', '180', '365', '548', '730', '1095'],
      maxCohortSizeOptions: ['0', '1000', '5000', '10000', '50000', '100000'],
      maxCohortSizeForFittingOptions: ['250000', '150000', '100000', '50000', '10000', '5000', '0'],
      yesNoOptions: [{
        name: ko.i18n('options.yes', 'Yes'),
        id: true,
      }, {
        name: ko.i18n('options.no', 'No'),
        id: false
      }],
      removeDuplicateSubjectOptions: [{
        name: ko.i18n('ple.spec.options.keepAll', 'Keep All'),
        id: 'keep all',
      }, {
        name: ko.i18n('ple.spec.options.keepFirst', 'Keep First'),
        id: 'keep first'
      }, {
        name: ko.i18n('ple.spec.options.removeAll', 'Remove All'),
        id: 'remove all'
      }],
      trimOptions: [{
        name: ko.i18n('ple.spec.options.none', 'None'),
        id: 'none',
      }, {
        name: ko.i18n('ple.spec.options.byPercent', 'By Percent'),
        id: 'byPercent'
      }, {
        name: ko.i18n('ple.spec.options.toEquipoise', 'To Equipoise'),
        id: 'toEquipoise'
      }],
      matchStratifyOptions: [{
        name: ko.i18n('ple.spec.options.none', 'None'),
        id: 'none',
      }, {
        name: ko.i18n('ple.spec.options.matchOnPropensityScore', 'Match on propensity score'),
        id: 'matchOnPs'
      }, {
        name: ko.i18n('ple.spec.options.stratifyOnPropensityScore', 'Stratify on propensity score'),
        id: 'stratifyByPs'
      }],
      caliperScaleOptions: [{
        name: ko.i18n('ple.spec.options.standardizedLogit', 'Standardized Logit'),
        id: 'standardized logit',
      }, {
        name: ko.i18n('ple.spec.options.standardized', 'Standardized'),
        id: 'standardized'
      }, {
        name: ko.i18n('ple.spec.options.propensityScore', 'Propensity score'),
        id: 'propensity score'
      }],
      stratificationBaseSelectionOptions: [{
        name: ko.i18n('ple.spec.options.all', 'All'),
        id: 'all',
      }, {
        name: ko.i18n('ple.spec.options.target', 'Target'),
        id: 'target'
      }, {
        name: ko.i18n('ple.spec.options.comparator', 'Comparator'),
        id: 'comparator'
      }],
      outcomeModelTypeOptions: [{
        name: ko.i18n('ple.spec.options.logisticRegression', 'Logistic regression'),
        id: 'logistic',
      }, {
        name: ko.i18n('ple.spec.options.poissonRegression', 'Poisson regression'),
        id: 'poisson'
      }, {
        name: ko.i18n('ple.spec.options.coxProportionalHazards', 'Cox proportional hazards'),
        id: 'cox'
      }],
      occurrenceTypeOptions: [{
        name: ko.i18n('ple.spec.options.allOccurrences', 'All occurrences'),
        id: 'all',
      }, {
        name: ko.i18n('ple.spec.options.firstOccurrence', 'First occurrence'),
        id: 'first'
      }],
      domains: [{
        name: ko.i18n('ple.spec.options.condition', 'Condition'),
        id: 'condition',
      }, {
        name: ko.i18n('ple.spec.options.drug', 'Drug'),
        id: 'drug'
      }, {
        name: ko.i18n('ple.spec.options.device', 'Device'),
        id: 'device'
      }, {
        name: ko.i18n('ple.spec.options.measurement', 'Measurement'),
        id: 'measurement'
      }, {
        name: ko.i18n('ple.spec.options.observation', 'Observation'),
        id: 'observation'
      }, {
        name: ko.i18n('ple.spec.options.procedure', 'Procedure'),
        id: 'procedure'
      }, {
        name: ko.i18n('ple.spec.options.visit', 'Visit'),
        id: 'visit'
      }],
      positiveControlSynthesisArgs: {
          modelType: [{
              name: ko.i18n('ple.spec.options.poisson', 'Poisson'),
              id: 'poisson',
          }, {
              name: ko.i18n('ple.spec.options.survival', 'Survival'),
              id: 'survival'
          }],
          minOutcomeCountForModelOptions: ['100', '75', '50', '25', '10'],
          minOutcomeCountForInjectionOptions: ['100', '75', '50', '25', '10'],
          washoutPeriodOptions: ['0', '1', '7', '14', '21', '30', '60', '90', '120', '180', '183', '365', '548', '730', '1095'],
          dayOptions: ['0', '1', '7', '14', '21', '30', '60', '90', '120', '180', '365', '548', '730', '1095'],
          maxSubjectsForModelOptions: ['0', '1000', '5000', '10000', '50000', '100000', '150000', '200000', '250000'],
          yesNoOptions: [{
              name: ko.i18n('options.yes', 'Yes'),
              id: true,
          }, {
              name: ko.i18n('options.no', 'No'),
              id: false
          }],
      }
    };
      const getCca = (canEdit) => [{
        comparisonTableColumns: [
            {
                title: ko.i18n('columns.remove', 'Remove'),
                render: (s, p, d) => {
                    return options.removeButton;
                },
                orderable: false,
                searchable: false,
                className: 'col-remove',
                visible: canEdit,
            },
                {
                title: ko.i18n('columns.targetId', 'Target Id'),
                data: d => d.target().id,
                visible: false,
            },
            {
                title: ko.i18n('columns.target', 'Target'),
                data: d => d.target().name,
            },
            {
                title: ko.i18n('columns.comparatorId', 'Comparator Id'),
                data: d => d.comparator().id,
                visible: false,
            },
            {
                title: ko.i18n('columns.comparator', 'Comparator'),
                data: d => d.comparator().name,
            },
            {
                title: ko.i18n('columns.outcomes', 'Outcomes'),
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
                title: ko.i18n('columns.ncOutcomes', 'NC Outcomes'),
                data: d => d.negativeControlOutcomesConceptSet().name,
            },
            {
                title: ko.i18n('columns.inclCovariates', 'Incl Covariates'),
                data: d => d.includedCovariateConceptSet().length,
                visible: false,
            },
            {
                title: ko.i18n('columns.exclCovariates', 'Excl Covariates'),
                data: d => d.excludedCovariateConceptSet().length,
                visible: false,
            },
            {
                title: ko.i18n('columns.copy', 'Copy'),
                render: (s, p, d) => {
                    return options.copyButton;
                },
                orderable: false,
                searchable: false,
                className: 'col-copy',
                visible: canEdit,
            },
        ],
        comparisonTableOptions: {
            ...commonUtils.getTableOptions('S'),
            dom: '<<"row vertical-align"<"col-xs-6"l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        },
        analysisSettingsTableColumns: [
            {
                title: ko.i18n('columns.remove', 'Remove'),
                render: (s, p, d) => {
                    return options.removeButton;
                },
                orderable: false,
                searchable: false,
                className: 'col-remove',
                visible: canEdit
            },
            {
                title: ko.i18n('columns.description', 'Description'),
                data: d => d.description(),
            },
            {
                title: ko.i18n('columns.timeAtRiskStart', 'Time At Risk Start'),
                render: (s, p, d) => {
                    if (d.createStudyPopArgs != null) {
                        return d.createStudyPopArgs.riskWindowStart() +
                          "<span data-bind=\"text: ko.i18n('common.daysAbbr', 'd')\"></span> " +
                          "<span data-bind=\"text: ko.i18n('ple.spec.from', 'from')\"></span><br/>" +
                          ko.unwrap(consts.timeAtRiskCohortDate.find(f => f.id === d.createStudyPopArgs.addExposureDaysToStart()).name);
                    } else {
                        return '';
                    }
                }
            },
            {
              title: ko.i18n('columns.timeAtRiskEnd', 'Time At Risk End'),
              render: (s, p, d) => {
                    if (d.createStudyPopArgs != null) {
                        return d.createStudyPopArgs.riskWindowEnd() +
                          "<span data-bind=\"text: ko.i18n('common.daysAbbr', 'd')\"></span> " +
                          "<span data-bind=\"text: ko.i18n('ple.spec.from', 'from')\"></span><br/>" +
                          ko.unwrap(consts.timeAtRiskCohortDate.find(f => f.id === d.createStudyPopArgs.addExposureDaysToEnd()).name);
                    } else {
                        return '';
                    }
                }
            },
            {
              title: ko.i18n('columns.minimumTimeAtRisk', 'Minimum Time At Risk'),
              render: (s, p, d) => {
                    if (d.createStudyPopArgs != null) {
                        return d.createStudyPopArgs.minDaysAtRisk() + "<span data-bind=\"text: ko.i18n('common.daysAbbr', 'd')\"></span>";
                    } else {
                        return '';
                    }
                }
            },
          {
                title: ko.i18n('columns.adjustmentStrategy', 'Adjustment Strategy'),
                render: (s, p, d) => {
                    if (d.matchOnPs()) {
                        return ko.i18nformat('ple.spec.options.matching', '<%=ratio%>:1 matching', {ratio: d.matchOnPsArgs.maxRatio()})();
                    } else if (d.stratifyByPs()) {
                        return ko.i18nformat('ple.spec.options.stratification', 'Stratification (stratum: <%=stratum%>)', {stratum: d.stratifyByPsArgs.numberOfStrata()})();
                    } else {
                        return ko.i18n('ple.spec.options.none', 'None')();
                    }
                }
            },
            {
                title: ko.i18n('columns.outcomeModel', 'Outcome Model'),
                render: (s, p, d) => {
                    if (d.fitOutcomeModelArgs != null) {
                        return d.fitOutcomeModelArgs.modelType();
                    } else {
                        return '';
                    }
                }
            },
            {
                title: ko.i18n('columns.copy', 'Copy'),
                render: (s, p, d) => {
                    return options.copyButton;
                },
                orderable: false,
                searchable: false,
                className: 'col-copy',
                visible: canEdit
            },
        ],
        analysisSettingsTableOptions: {
            ...commonUtils.getTableOptions('S'),
            dom: '<<"row vertical-align"<"col-xs-6"l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        },
        fullAnalysisTableColumns: [
            {
                title: ko.i18n('columns.targetId', 'Target Id'),
                data: d => d.targetComparatorOutcome.target.id,
                visible: false,
            },
            {
                title: ko.i18n('columns.targetCohortName', 'Target Cohort Name'),
                data: d => d.targetComparatorOutcome.target.name,
            },
            {
                title: ko.i18n('columns.comparatorId', 'Comparator Id'),
                data: d => d.targetComparatorOutcome.comparator.id,
                visible: false,
            },
            {
                title: ko.i18n('columns.comparatorCohortName', 'Comparator Cohort Name'),
                data: d => d.targetComparatorOutcome.comparator.name,
            },
            {
                title: ko.i18n('columns.outcomes', 'Outcomes'),
                data: d => d.targetComparatorOutcome.outcome.id,
                visible: false,
            },
            {
                title: ko.i18n('columns.outcomeCohortName', 'Outcome Cohort Name'),
                data: d => d.targetComparatorOutcome.outcome.name,
            },
            {
                title: ko.i18n('columns.analysisName', 'Analysis Name'),
                data: d => d.cohortMethodAnalysis.description(),
            },
            {
                title: ko.i18n('columns.timeAtRisk', 'Time At Risk'),
                data: d => {
                    //return (d.cohortMethodAnalysis.createStudyPopArgs.riskWindowStart() + "-" + d.cohortMethodAnalysis.createStudyPopArgs.riskWindowEnd() + "d<br/>(min: " + d.cohortMethodAnalysis.createStudyPopArgs.minDaysAtRisk() + "d)");
                    return getTimeAtRisk(d.cohortMethodAnalysis.createStudyPopArgs);
                }
            },
            {
                title: ko.i18n('columns.outcomeModel', 'Outcome Model'),
                data: d => {
                    return d.cohortMethodAnalysis.fitOutcomeModelArgs.modelType();
                },
            }
        ],
        fullAnalysisTableOptions: {
            ...commonUtils.getTableOptions('S'),
            dom: '<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
            domNoButtons: '<<"row vertical-align"<"col-xs-6"l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
            Facets: [{
                'caption': ko.i18n('facets.caption.targetCohorts', 'Target Cohorts'),
                'binding': d => d.targetComparatorOutcome.target.name,
            },
            {
                'caption': ko.i18n('facets.caption.comparatorCohorts', 'Comparator Cohorts'),
                'binding': d => d.targetComparatorOutcome.comparator.name,
            },
            {
                'caption': ko.i18n('facets.caption.outcomeCohorts', 'Outcome Cohorts'),
                'binding': d => d.targetComparatorOutcome.outcome.name,
            },
            {
                'caption': ko.i18n('facets.caption.analysisName', 'Analysis Name'),
                'binding': d => d.cohortMethodAnalysis.description(),
            },
            ]
        }
      }];

    return {
      pageTitle,
      apiPaths,
      paths: paths,
      conceptSetCrossReference,
      isUsingRegularization,
      setRegularization,
      options,
      getCca,
    };
  }
);