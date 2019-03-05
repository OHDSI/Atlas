define(
  (require, exports) => {
    const pageTitle = 'Prediction';
    const ko = require('knockout');
    const config = require('appConfig');
    const _ = require('lodash');
    const consts = require('const');

    const apiPaths = {
      downloadPackage: (id, name) => `prediction/${id}/download?packageName=${name}`,
			downloadResults: id => `prediction/generation/${id}/result`,
    };

    const paths = {
      root: '/prediction/',
      analysis: id => `#/prediction/${id}`,
      createAnalysis: () => '#/prediction/0',
      browser: () => '#/prediction',
    };

    const conceptSetCrossReference = {
      covariateSettings: {
        targetName: "covariateSettings",
        propertyName: {
          includedCovariateConcepts: "includedCovariateConceptIds",
          excludedCovariateConcepts: "excludedCovariateConceptIds",
        },
      },
    };

		const predictionGenerationStatus = consts.generationStatuses;

    const defaultNontemporalCovariates = {
      "temporal": false,
      "DemographicsGender": true,
      "DemographicsAgeGroup": true,
      "DemographicsRace": true,
      "DemographicsEthnicity": true,
      "DemographicsIndexMonth": true,
      "ConditionGroupEraLongTerm": true,
      "ConditionGroupEraShortTerm": true,
      "DrugGroupEraLongTerm": true,
      "DrugGroupEraShortTerm": true,
      "DrugGroupEraOverlapping": true,
      "ProcedureOccurrenceLongTerm": true,
      "ProcedureOccurrenceShortTerm": true,
      "DeviceExposureLongTerm": true,
      "DeviceExposureShortTerm": true,
      "MeasurementLongTerm": true,
      "MeasurementShortTerm": true,
      "MeasurementRangeGroupLongTerm": true,
      "ObservationLongTerm": true,
      "ObservationShortTerm": true,
      "CharlsonIndex": true,
      "Dcsi": true,
      "Chads2": true,
      "Chads2Vasc": true,
      "includedCovariateConceptIds": [],
      "includedCovariateIds": [],
      "addDescendantsToInclude": false,
      "excludedCovariateConceptIds": [],
      "addDescendantsToExclude": false,
      "shortTermStartDays": -30,
      "mediumTermStartDays": -180,
      "endDays": 0,
      "longTermStartDays": -365
    };

    const options = {
      removeButton: `<button type="button" class="btn btn-danger btn-xs btn-remove"><i class="fa fa-times" aria-hidden="true"></i></button>`,
      cohortTableColumns: [
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
      ],
      targetOutcomeTableColumns: [
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
      ],
      modelCovarPopTupleTableColumns: [
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
      ],
      fullAnalysisTableColumns: [
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
      },
      populationSettingsTableColumns: [
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
            render: (s, p, d) => {
                return d.riskWindowStart().toString() + 'd from<br/>' + consts.timeAtRiskCohortDate.find(f => f.id === d.addExposureDaysToStart()).name;
            },
        },
        {
            title: 'Risk Window End',
            render: (s, p, d) => {
                return d.riskWindowEnd().toString() + 'd from<br/>' + consts.timeAtRiskCohortDate.find(f => f.id === d.addExposureDaysToEnd()).name;
            },
        },
        {
            title: 'Washout Period',
            data: d => d.washoutPeriod().toString() + 'd',
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
            data: d => d.priorOutcomeLookback().toString() + 'd',
            visible: false,
        },
        {
            title: 'Require Time At Risk',
            data: d => d.requireTimeAtRisk().toString(),
            visible: false,
        },
        {
            title: 'Minimum Time At Risk',
            data: d => d.minTimeAtRisk().toString() + 'd',
        },
      ],
      modelSettingsTableColumns: [
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
                const key = Object.keys(d)[0];
                return ko.toJSON(d[key]);
            },
        },
    ],
    covariateSettingsTableColumns: [
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
            title: 'Temporal',
            render: (s, p, d) => {
              return Object.keys(d)[0] === 'temporal' ? 'Yes': 'No'
            },
            visible: false,
        },
        {
            title: 'Options',
            render: (s, p, d, a, b, c) => {
                const keys = Object.keys(d);
                const vals = Object.values(d);
                var settings = [];
                const defaultDisplayLength = 5;
                for (let i = 0; i < keys.length; i++) {
                    const currentVal = ko.isObservable(vals[i]) ? vals[i]() : vals[i];
                    if (currentVal === true) {
                        settings.push(keys[i]);
                    }
                }
                if (settings.length > 1) {
                    let displayVal = "";
                    settings.forEach((element, index) => {
                        if (index < defaultDisplayLength) {
                            if (index < settings.length - 1) {
                                displayVal += (element + ", ");
                            } else {
                                displayVal += element;
                            }
                        } else if (index === defaultDisplayLength) {
                            displayVal = displayVal + element + "&nbsp;&nbsp;<div class=\"tool-tip\">(+" + (settings.length - defaultDisplayLength - 1) + " more covariate settings<span class=\"tooltiptext\">";
                        } else if (index > defaultDisplayLength) {
                            displayVal += ("<span class=\"tooltipitem\">" + element + "</span>");
                        }
                    });
                    if (settings.length > defaultDisplayLength) {
                        displayVal += "</span>)</div>";
                    }
                    return displayVal;
                } else if (settings.length === 1) {
                    return settings[0];
                } else {
                    return 'No covariate settings selected';
                }
            }
        },
      ],
      specificationSummaryTableOptions: {
        pageLength: 10,
        lengthMenu: [
            [10, 25, 50, 100, -1],
            ['10', '25', '50', '100', 'All']
        ],
        dom: '<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        domNoButtons: '<<"row vertical-align"<"col-xs-6"l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
      },
      covariateSettingsTableOptions: {
        pageLength: 10,
        lengthMenu: [
            [10, 25, 50, 100, -1],
            ['10', '25', '50', '100', 'All']
        ],
        dom: '<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        domNoButtons: '<<"row vertical-align"<"col-xs-6"l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        //'<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>';
      },
      nfoldOptions: _.range(2,16).map(v => '' + v),
	  dayOptions: ['0', '1', '7', '14', '21', '30', '60', '90', '120', '180', '365', '548', '730', '1095'],
      sampleSizeOptions: ['1000', '5000', '10000', '50000', '100000'],
      delCovariatesSmallCount: ['5', '10', '15', '20', '25', '50', '75', '100', '150', '200', '500'],
      yesNoOptions: [{
        name: "Yes",
        id: true,
      }, {
        name: "No",
        id: false
      }],
      yesNoIntOptions: [{
            name: "Yes",
            id: "1"
        }, {
            name: "No",
            id: "0"
		}],
      testSplit: [{
        name: 'time',
        desc: 'Time',
      }, {
        name: 'person',
        desc: 'Person',
      }],
      trueFalseOptions: [{label: "true", value: true}, {label: "false", value: false}],
      classWeightOptions: [{label: "None", value: 'None'},{label: "Balanced", value: 'Balanced'}],
    };

    return {
      apiPaths,
      pageTitle,
      paths: paths,
      conceptSetCrossReference,
      defaultNontemporalCovariates,
      options,
      predictionGenerationStatus,
    };
  }
);