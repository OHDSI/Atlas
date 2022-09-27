define([
	'knockout',
	'text!./cohort-method-analysis-editor.html',
	'components/Component',
	'utils/CommonUtils',
	'const',
	'../../const',
	'utils/DataTypeConverterUtils',
	'services/analysis/ConceptSet',
	'databindings',
	'cyclops',
	'./match-args-editor',
	'./stratify-args-editor',
	'./outcome-model-args-editor',
	'featureextraction/components/covariate-settings-editor',
	'components/entityBrowsers/cohort-definition-browser',
	'less!./cohort-method-analysis.less',
], function (
	ko,
	view,
	Component,
	commonUtils,
	constants,
	estimationConstants,
	dataTypeConverterUtils,
	ConceptSet,
) {
	class CohortMethodAnalysisEditor extends Component {
		constructor(params) {
            super(params);

			this.analysis = params.analysis;
			this.constants = constants;
			this.options = estimationConstants.options;
			this.subscriptions = params.subscriptions;
			this.editorMode = ko.observable('all');
			this.isEditPermitted = params.isEditPermitted;
			this.showCovariateSelector = ko.observable(false);
			this.showControlDisplay = ko.observable(false);
			this.showPriorDisplay = ko.observable(false);
			this.showConceptSetSelector = ko.observable(false);
			this.currentConceptSet = ko.observable(null);
			this.trimSelection = ko.observable();
			this.matchStratifySelection = ko.observable();
			this.excludeCovariateIds = ko.observable(this.analysis.createPsArgs.excludeCovariateIds() && this.analysis.createPsArgs.excludeCovariateIds().length > 0 ? this.analysis.createPsArgs.excludeCovariateIds().join() : '');
			this.includeCovariateIds = ko.observable(this.analysis.createPsArgs.includeCovariateIds() && this.analysis.createPsArgs.includeCovariateIds().length > 0 ? this.analysis.createPsArgs.includeCovariateIds().join() : '');
			this.cvIncludeCovariateIds = ko.observable(this.analysis.getDbCohortMethodDataArgs.covariateSettings.includedCovariateIds() && this.analysis.getDbCohortMethodDataArgs.covariateSettings.includedCovariateIds().length > 0 ? this.analysis.getDbCohortMethodDataArgs.covariateSettings.includedCovariateIds().join() : '');
			this.trimFraction = ko.observable(this.analysis.trimByPsArgs.trimFraction() ? dataTypeConverterUtils.convertFromPercent(this.analysis.trimByPsArgs.trimFraction()) : '');
			this.bounds = ko.observable(this.analysis.trimByPsToEquipoiseArgs.bounds() && this.analysis.trimByPsToEquipoiseArgs.bounds().length > 0 ? dataTypeConverterUtils.percentArrayToCommaDelimitedList(this.analysis.trimByPsToEquipoiseArgs.bounds()) : '');
			this.studyStartDate = ko.observable(this.analysis.getDbCohortMethodDataArgs.studyStartDate() !== null ? dataTypeConverterUtils.convertFromRDateToDate(this.analysis.getDbCohortMethodDataArgs.studyStartDate()) : null);
			this.studyEndDate = ko.observable(this.analysis.getDbCohortMethodDataArgs.studyEndDate() !== null ? dataTypeConverterUtils.convertFromRDateToDate(this.analysis.getDbCohortMethodDataArgs.studyEndDate()) : null);
			this.useRegularization = ko.observable(estimationConstants.isUsingRegularization(this.analysis.createPsArgs.prior) ? true : false);

			this.subscriptions.push(this.includeCovariateIds.subscribe(newValue => {
				this.analysis.createPsArgs.includeCovariateIds(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));

			this.subscriptions.push(this.excludeCovariateIds.subscribe(newValue => {
				this.analysis.createPsArgs.excludeCovariateIds(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));

			this.subscriptions.push(this.cvIncludeCovariateIds.subscribe(newValue => {
				this.analysis.getDbCohortMethodDataArgs.covariateSettings.includedCovariateIds(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));

			this.subscriptions.push(this.trimFraction.subscribe(newValue => {
				this.analysis.trimByPsArgs.trimFraction(dataTypeConverterUtils.convertToPercent(newValue));
			}));

			this.subscriptions.push(this.bounds.subscribe(newValue => {
				this.analysis.trimByPsToEquipoiseArgs.bounds(dataTypeConverterUtils.commaDelimitedListToPercentArray(newValue));
			}));

			this.subscriptions.push(this.studyStartDate.subscribe(newValue => {
				this.analysis.getDbCohortMethodDataArgs.studyStartDate(dataTypeConverterUtils.convertToDateForR(newValue));
			}));

			this.subscriptions.push(this.studyEndDate.subscribe(newValue => {
				this.analysis.getDbCohortMethodDataArgs.studyEndDate(dataTypeConverterUtils.convertToDateForR(newValue));
			}));

			this.subscriptions.push(this.trimSelection.subscribe(newValue => {
				this.analysis.trimByPs(this.trimSelection() === "byPercent");
				this.analysis.trimByPsToEquipoise(this.trimSelection() === "toEquipoise");
				this.setCreatePs();
			}));

			this.subscriptions.push(this.useRegularization.subscribe(newValue => {
				estimationConstants.setRegularization(newValue, this.analysis.createPsArgs.prior);
			}));

			// Initialize trimSelection
			if (this.analysis.trimByPs()) {
				this.trimSelection("byPercent")
			} else if (this.analysis.trimByPsToEquipoise()) {
				this.trimSelection("toEquipoise")
			} else {
				this.trimSelection("none")
			}

			// Initialize matchStratifySelection
			if (this.analysis.matchOnPs()) {
				this.matchStratifySelection("matchOnPs")
			} else if (this.analysis.matchOnPsAndCovariates()) {
				this.matchStratifySelection("matchOnPsAndCovariates")
			} else if (this.analysis.stratifyByPs()) {
				this.matchStratifySelection("stratifyByPs")
			} else if (this.analysis.stratifyByPsAndCovariates()) {
				this.matchStratifySelection("stratifyOnPsAndCovariates")
			} else {
				this.matchStratifySelection("none")
			}

			// Set the subscription
			this.subscriptions.push(this.matchStratifySelection.subscribe(newValue => {
				this.analysis.matchOnPs(this.matchStratifySelection() === "matchOnPs");
				this.analysis.matchOnPsAndCovariates(this.matchStratifySelection() === "matchOnPsAndCovariates");
				this.analysis.stratifyByPs(this.matchStratifySelection() === "stratifyByPs");
				this.analysis.stratifyByPsAndCovariates(this.matchStratifySelection() === "stratifyOnPsAndCovariates");
				this.setCreatePs();
			}));
			
			
			this.subscriptions.push(this.analysis.fitOutcomeModelArgs.inversePtWeighting.subscribe(newValue => {
				this.setCreatePs();
			}));
		}

		toggleControlDisplay() {
			this.showControlDisplay(!this.showControlDisplay());
		}

		togglePriorDisplay() {
			this.showPriorDisplay(!this.showPriorDisplay());
		}

		conceptsetSelected(d) {
			this.currentConceptSet()(new ConceptSet({id: d.id, name: d.name}));
			this.showConceptSetSelector(false);
		}

		chooseIncludedCovariates() {
			this.showConceptSetSelector(true);
			this.currentConceptSet(this.analysis.getDbCohortMethodDataArgs.covariateSettings.includedCovariateConceptSet);
		}

		clearIncludedCovariates () {
			this.analysis.getDbCohortMethodDataArgs.covariateSettings.includedCovariateConceptSet(new ConceptSet());
		}

		chooseExcludedCovariates() {
			this.showConceptSetSelector(true);
			this.currentConceptSet(this.analysis.getDbCohortMethodDataArgs.covariateSettings.excludedCovariateConceptSet);
		}

		clearExcludedCovariates () {
			this.analysis.getDbCohortMethodDataArgs.covariateSettings.excludedCovariateConceptSet(new ConceptSet());
		}

		setCreatePs() {
			if (this.matchStratifySelection() && this.trimSelection()) {
				this.analysis.createPs(
					!(this.matchStratifySelection() === "none" && this.trimSelection() === "none")
				);
			}
			if (this.analysis.fitOutcomeModelArgs.inversePtWeighting()) {
				this.analysis.createPs(true);
			}
		}

	}

	return commonUtils.build('cohort-method-analysis-editor', CohortMethodAnalysisEditor, view);
});