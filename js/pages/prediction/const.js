define(
  (require, exports) => {
    const pageTitle = 'Prediction';
    const ko = require('knockout');
    const config = require('appConfig');
    const commonUtils = require('utils/CommonUtils');
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
      targetOutcomeTableColumns: [
        {
            title: ko.i18n('columns.targetId', 'Target Id'),
            data: d => d.targetId,
            visible: false,
        },
        {
            title: ko.i18n('columns.targetName', 'Target Cohort Name'),
            data: d => d.targetName,
        },
        {
            title: ko.i18n('columns.outcomeId', 'Outcome Id'),
            data: d => d.outcomeId,
            visible: false,
        },
        {
            title: ko.i18n('columns.outcomeName', 'Outcome Cohort Name'),
            data: d => d.outcomeName,
        },
      ],
      modelCovarPopTupleTableColumns: [
        {
            title: ko.i18n('columns.modelName', 'Model Name'),
            data: d => d.modelName,
        },
        {
            title: ko.i18n('columns.modelSettings', 'Model Settings'),
            data: d => d.modelSettings,
        },
        {
            title: ko.i18n('columns.covariateSettings', 'Covariate Settings'),
            data: d => d.covariateSettings.substring(1,30) + "...",
        },
        {
            title: ko.i18n('columns.riskWindowStart', 'Risk Window Start'),
            data: d => d.popRiskWindowStart,
        },
        {
            title: ko.i18n('columns.riskWindowEnd', 'Risk Window End'),
            data: d => d.popRiskWindowEnd,
        },
      ],
      fullAnalysisTableColumns: [
        {
            title: ko.i18n('columns.targetId', 'Target Id'),
            data: d => d.targetOutcome.targetId,
            visible: false,
        },
        {
            title: ko.i18n('columns.targetName', 'Target Cohort Name'),
            data: d => d.targetOutcome.targetName,
        },
        {
            title: ko.i18n('columns.outcomeId', 'Outcome Id'),
            data: d => d.targetOutcome.outcomeId,
            visible: false,
        },
        {
            title: ko.i18n('columns.outcomeName', 'Outcome Cohort Name'),
            data: d => d.targetOutcome.outcomeName,
        },
        {
            title: ko.i18n('columns.modelName', 'Model Name'),
            data: d => d.modelCovarPopTuple.modelName,
        },
        {
            title: ko.i18n('columns.modelSettings', 'Model Settings'),
            data: d => d.modelCovarPopTuple.modelSettings,
        },
        {
            title: ko.i18n('columns.covariateSettings', 'Covariate Settings'),
            data: d => d.modelCovarPopTuple.covariateSettings.substring(1,30) + "...",
        },
        {
            title: ko.i18n('columns.riskWindowStart', 'Risk Window Start'),
            data: d => d.modelCovarPopTuple.popRiskWindowStart,
        },
        {
            title: ko.i18n('columns.riskWindowEnd', 'Risk Window End'),
            data: d => d.modelCovarPopTuple.popRiskWindowEnd,
        },
      ],
      fullAnalysisTableOptions: {
        ...commonUtils.getTableOptions('S'),
        dom: '<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        domNoButtons: '<<"row vertical-align"<"col-xs-6"l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        Facets: [{
            'caption': ko.i18n('facets.caption.targetCohorts', 'Target Cohorts'),
            'binding': d => d.targetOutcome.targetName,
        },
        {
            'caption': ko.i18n('facets.caption.outcomeCohorts', 'Outcome Cohorts'),
            'binding': d => d.targetOutcome.outcomeName,
        },
        {
            'caption': ko.i18n('facets.caption.modelName', 'Model Name'),
            'binding': d => d.modelCovarPopTuple.modelName,
        },
        {
            'caption': ko.i18n('facets.caption.riskWindow', 'Risk Window'),
            'binding': d => {
                return d.modelCovarPopTuple.popRiskWindowStart + "-" + d.modelCovarPopTuple.popRiskWindowEnd;
            },
        },
        ]
      },
      specificationSummaryTableOptions: {
        ...commonUtils.getTableOptions('S'),
        dom: '<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        domNoButtons: '<<"row vertical-align"<"col-xs-6"l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
      },
      covariateSettingsTableOptions: {
        ...commonUtils.getTableOptions('S'),
        dom: '<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        domNoButtons: '<<"row vertical-align"<"col-xs-6"l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        //'<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>';
      },
      nfoldOptions: _.range(2,16).map(v => '' + v),
	  dayOptions: ['0', '1', '7', '14', '21', '30', '60', '90', '120', '180', '365', '548', '730', '1095'],
      sampleSizeOptions: ['1000', '5000', '10000', '50000', '100000'],
      delCovariatesSmallCount: ['5', '10', '15', '20', '25', '50', '75', '100', '150', '200', '500'],
      yesNoOptions: [{
        name: ko.i18n('options.yes', 'Yes'),
        id: true,
      }, {
        name: ko.i18n('options.no', 'No'),
        id: false
      }],
      yesNoIntOptions: [{
        name: ko.i18n('options.yes', 'Yes'),
        id: "1"
      }, {
        name: ko.i18n('options.no', 'No'),
        id: "0"
      }],
      testSplit: [{
        name: 'time',
        desc: ko.i18n('options.time', 'Time'),
      }, {
        name: 'person',
        desc: ko.i18n('options.person', 'Person'),
      }],
      trueFalseOptions: [{label: ko.i18n('options.true', 'true'), value: true}, {label: ko.i18n('options.false', 'false'), value: false}],
      classWeightOptions: [{label: ko.i18n('options.none', 'None'), value: 'None'},{label: ko.i18n('options.balanced', 'Balanced'), value: 'Balanced'}],
    };

    const getCohortTableColumns = (canEdit) => [
        {
          title: ko.i18n('columns.remove', 'Remove'),
          render: function (s, p, d) {
            return options.removeButton;
          },
          orderable: false,
          searchable: false,
          className: 'col-remove',
          visible: canEdit,
        },
        {
          title: ko.i18n('columns.id', 'Id'),
          data: d => d.id,
          visible: false,
        },
        {
          title: ko.i18n('columns.name', 'Name'),
          data: d => d.name,
        },
      ];

    const getPopulationSettingsTableColumns = (canEdit) => [
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
          title: ko.i18n('columns.binary', 'Binary'),
          data: d => d.binary().toString(),
          visible: false,
        },
        {
          title: ko.i18n('columns.firstExposureOnly', 'First Exposure Only'),
          data: d => d.firstExposureOnly().toString(),
          visible: false,
        },
        {
          title: ko.i18n('columns.riskWindowStart', 'Risk Window Start'),
          render: (s, p, d) => {
            return d.riskWindowStart().toString() +
              "<span data-bind=\"text: ko.i18n('common.daysAbbr', 'd')\"></span> " +
              "<span data-bind=\"text: ko.i18n('ple.spec.from', 'from')\"></span><br/>" +
              ko.unwrap(consts.timeAtRiskCohortDate.find(f => f.id === d.addExposureDaysToStart()).name);
          },
        },
        {
          title: ko.i18n('columns.riskWindowEnd', 'Risk Window End'),
          render: (s, p, d) => {
            return d.riskWindowEnd().toString() +
              "<span data-bind=\"text: ko.i18n('common.daysAbbr', 'd')\"></span> " +
              "<span data-bind=\"text: ko.i18n('ple.spec.from', 'from')\"></span><br/>" +
              ko.unwrap(consts.timeAtRiskCohortDate.find(f => f.id === d.addExposureDaysToEnd()).name);
          },
        },
        {
          title: ko.i18n('columns.washoutPeriod', 'Washout Period'),
          data: d => d.washoutPeriod().toString() + 'd',
        },
        {
          title: ko.i18n('columns.includeAllOutcomes', 'Include All Outcomes'),
          data: d => d.includeAllOutcomes().toString(),
        },
        {
          title: ko.i18n('columns.removeSubjectsWithPriorOutcome', 'Remove Subjects With Prior Outcome'),
          data: d => d.removeSubjectsWithPriorOutcome().toString(),
        },
        {
          title: ko.i18n('columns.priorOutcomeLookback', 'Prior Outcome Lookback'),
          data: d => d.priorOutcomeLookback().toString() + 'd',
          visible: false,
        },
        {
          title: ko.i18n('columns.requireTimeAtRisk', 'Require Time At Risk'),
          data: d => d.requireTimeAtRisk().toString(),
          visible: false,
        },
        {
          title: ko.i18n('columns.minimumTimeAtRisk', 'Minimum Time At Risk'),
          data: d => d.minTimeAtRisk().toString() + 'd',
        },
      ];

    const getModelSettingsTableColumns = (canEdit) => [
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
          title: ko.i18n('columns.model', 'Model'),
          data: d => Object.keys(d)[0],
        },
        {
          title: ko.i18n('columns.options', 'Options'),
          data: d => {
            const key = Object.keys(d)[0];
            return ko.toJSON(d[key]);
          },
        },
      ];

    const getCovariateSettingsTableColumns = (canEdit) => [
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
          title: ko.i18n('columns.temporal', 'Temporal'),
          render: (s, p, d) => {
            return Object.keys(d)[0] === 'temporal' ? 'Yes': 'No'
          },
          visible: false,
        },
        {
          title: ko.i18n('columns.options', 'Options'),
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
      ];

    return {
      apiPaths,
      pageTitle,
      paths: paths,
      conceptSetCrossReference,
      defaultNontemporalCovariates,
      options,
      predictionGenerationStatus,
      getCohortTableColumns,
      getPopulationSettingsTableColumns,
      getModelSettingsTableColumns,
      getCovariateSettingsTableColumns,
    };
  }
);