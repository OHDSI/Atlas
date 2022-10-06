define([
	'knockout',
	'text!./prediction-specification-view-edit.html',
	'utils/AutoBind',
	'components/Component',
	'utils/CommonUtils',
	'../const',
	'services/analysis/Cohort',
	'../inputTypes/ModelSettings',
	'../inputTypes/CreateStudyPopulationArgs',
	'../inputTypes/PredictionCovariateSettings',
	'featureextraction/components/covariate-settings-editor',
	'featureextraction/components/temporal-covariate-settings-editor',
	'components/entityBrowsers/cohort-definition-browser',
	'faceted-datatable',
	'less!./prediction-specification-view-edit.less',
], function (
	ko,
	view,
	AutoBind,
	Component,
	commonUtils,
	constants,
	Cohort,
	ModelSettings,
	CreateStudyPopulationArgs,
	PredictionCovariateSettings,
) {
	class PredictionSpecificationViewEdit extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.subscriptions = params.subscriptions;
			this.editorComponentName = ko.observable(null);
			this.editorComponentParams = ko.observable({});
			this.editorDescription = ko.observable();
			this.editorHeading = ko.observable();
			this.editorArray = ko.observableArray();
			this.options = constants.options;
			this.managerMode = ko.observable('summary');
			this.patientLevelPredictionAnalysis = params.patientLevelPredictionAnalysis;
			this.specificationPillMode = ko.observable('all');
			this.targetCohorts = params.targetCohorts;
			this.outcomeCohorts = params.outcomeCohorts;
			this.currentCohortList = ko.observable(null);
			this.showCohortSelector = ko.observable(false);
			this.covariateSettings = this.patientLevelPredictionAnalysis().covariateSettings;
			this.modelSettings = this.patientLevelPredictionAnalysis().modelSettings;
			this.populationSettings = this.patientLevelPredictionAnalysis().populationSettings;
			this.modelSettingsOptions = ModelSettings.options;
			this.defaultCovariateSettings = constants.defaultNontemporalCovariates;
			this.isEditPermitted = params.isEditPermitted;
			this.cohortTableColumns = constants.getCohortTableColumns(this.isEditPermitted());
			this.populationSettingsTableColumns = constants.getPopulationSettingsTableColumns(this.isEditPermitted());
			this.modelSettingsTableColumns = constants.getModelSettingsTableColumns(this.isEditPermitted());
			this.covariateSettingsTableColumns = constants.getCovariateSettingsTableColumns(this.isEditPermitted());
			this.language = ko.i18n('datatable.language');
		}

		removeTargetCohort(data, obj, tableRow, rowIndex) {
			this.deleteFromTable(this.targetCohorts, obj, rowIndex);
		}

		removeOutcomeCohort(data, obj, tableRow, rowIndex) {
			this.deleteFromTable(this.outcomeCohorts, obj, rowIndex);
		}

		modelSettingRowClickHandler(data, obj, tableRow, rowIndex) {
			if (
				obj.target.className.indexOf("btn-remove") >= 0 ||
				obj.target.className.indexOf("fa-times") >= 0
			) {
				this.deleteFromTable(this.modelSettings, obj, rowIndex);
			} else {
				this.editModelSettings(data);
			}
		}

		covariateSettingRowClickHandler(data, obj, tableRow, rowIndex) {
			if (
				obj.target.className.indexOf("btn-remove") >= 0 ||
				obj.target.className.indexOf("fa-times") >= 0
			) {
				this.deleteFromTable(this.patientLevelPredictionAnalysis().covariateSettings, obj, rowIndex);
			} else {
				this.editCovariateSettings(data);
			}
		}

		populationSettingRowClickHandler(data, obj, tableRow, rowIndex) {
			if (
				obj.target.className.indexOf("btn-remove") >= 0 ||
				obj.target.className.indexOf("fa-times") >= 0
			) {
				this.deleteFromTable(this.patientLevelPredictionAnalysis().populationSettings, obj, rowIndex);
			} else {
				this.editPopulationSettings(data);
			}
		}

		addTarget() {
			this.currentCohortList(this.targetCohorts);
			this.showCohortSelector(true);
		}

		addOutcome() {
			this.currentCohortList(this.outcomeCohorts);
			this.showCohortSelector(true);
		}

		cohortSelected(items) {
			const cohortList = items.map(({ id, name }) => new Cohort({ id, name }));
			this.currentCohortList()(cohortList);
			this.showCohortSelector(false);
		}

		deleteFromTable(list, obj, index) {
			// Check if the button or inner element were clicked
			if (
				obj.target.className.indexOf("btn-remove") >= 0 ||
				obj.target.className.indexOf("fa-times") >= 0
			) {
				list.splice(index, 1);
			}
		}

		// For later when we support temporal and non-temporal covariate settings
		/*
		addCovariateSettings(setting) {
			const covariateSettings = (setting == 'Temporal') ? new TemporalCovariateSettings(this.defaultTemporalCovariateSettings) : new PredictionCovariateSettings(this.defaultCovariateSettings);
			const headingPrefix = (setting == 'Temporal') ? 'Temporal ' : '';
			const editorNamePrefix = (setting == 'Temporal') ? 'temporal-' : '';
			this.patientLevelPredictionAnalysis().covariateSettings.push(
				covariateSettings
			);
			var index = this.patientLevelPredictionAnalysis().covariateSettings().length - 1;
			this.editorHeading(headingPrefix + 'Covariate Settings');
			this.editorDescription('Add or update the covariate settings');
			this.editorComponentName(editorNamePrefix + 'prediction-covar-settings-editor');
			this.editorComponentParams({
				covariateSettings: this.patientLevelPredictionAnalysis().covariateSettings()[index],
			});
			this.managerMode('editor');
		}
		*/

		addCovariateSettings() {
			const covariateSettings = new PredictionCovariateSettings(this.defaultCovariateSettings);
			this.patientLevelPredictionAnalysis().covariateSettings.push(
				covariateSettings
			);
			const index = this.patientLevelPredictionAnalysis().covariateSettings().length - 1;
			this.editCovariateSettings(this.patientLevelPredictionAnalysis().covariateSettings()[index]);
		}

		editCovariateSettings(settings) {
			this.editorArray = this.covariateSettings;
			this.editorHeading(ko.i18n('predictions.covariateSettingsTitle', 'Covariate Settings'));
			this.editorDescription(ko.i18n('predictions.covariateSettingsDesc', 'Add or update the covariate settings'));
			this.editorComponentName('prediction-covar-settings-editor');
			this.editorComponentParams({
				covariateSettings: settings,
				subscriptions: this.subscriptions,
				isEditPermitted: this.isEditPermitted
			});
			this.managerMode('editor');
		}

		addModelSettings(d) {
			this.modelSettings.push(d.action());
			const index = this.modelSettings().length - 1;
			this.editModelSettings(this.modelSettings()[index], d.editor);
		}

		editModelSettings(modelSettings, editor) {
			const option = ModelSettings.GetOptionsFromObject(modelSettings);
			if (editor === undefined) {
				editor = option.editor;
			}
			this.editorArray = this.modelSettings;
			this.editorHeading(ko.i18n(option.name, option.defaultName));
			this.editorDescription(ko.i18n('predictions.modelSettingsDesc', 'Use the options below to edit the model settings'));
			this.editorComponentName('model-settings-editor');
			this.editorComponentParams({
				subscriptions: this.subscriptions,
				modelSettings: modelSettings,
				editor: editor,
			});
			this.managerMode('editor');
		}

		addPopulationSettings() {
			this.patientLevelPredictionAnalysis().populationSettings.push(
				new CreateStudyPopulationArgs()
			);
			const index = this.patientLevelPredictionAnalysis().populationSettings().length - 1;
			this.editPopulationSettings(this.patientLevelPredictionAnalysis().populationSettings()[index]);
		}

		editPopulationSettings(settings) {
			this.editorArray = this.populationSettings;
			this.editorHeading(ko.unwrap(ko.i18n('predictions.populationSettingsTitle', 'Population Settings')));
			this.editorDescription(ko.unwrap(ko.i18n('predictions.populationSettingsDesc', 'Add or update the population settings')));
			this.editorComponentName('population-settings-editor');
			this.editorComponentParams({
				populationSettings: settings,
				subscriptions: this.subscriptions,
				isEditPermitted: this.isEditPermitted
			});
			this.managerMode('editor');
		}

		closeEditor() {
			this.editorArray.valueHasMutated();
			this.managerMode('summary');
		}

	}

	return commonUtils.build('prediction-specification-view-edit', PredictionSpecificationViewEdit, view);
});