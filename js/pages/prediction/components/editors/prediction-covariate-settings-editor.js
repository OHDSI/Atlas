define([
	'knockout', 
	'text!./prediction-covariate-settings-editor.html',	
	'components/Component',
	'utils/CommonUtils',
	'utils/DataTypeConverterUtils',
	'../../const',
	'services/analysis/ConceptSet',
	'databindings',
	'featureextraction/components/covariate-settings-editor',
	'circe',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	dataTypeConverterUtils,
	constants,
	ConceptSet,
) {
	class PredictionCovariateSettingsEditor extends Component {
		constructor(params) {
			super(params);
			
			this.covariateSettings = params.covariateSettings;
			this.options = constants.options;
			this.subscriptions = params.subscriptions;
			this.currentConceptSet = ko.observable(null);
			this.showConceptSetSelector = ko.observable(false);
			this.includedCovariateIds = ko.observable(this.covariateSettings.includedCovariateIds() && this.covariateSettings.includedCovariateIds().length > 0 ? this.analysis.getDbCohortMethodDataArgs.covariateSettings.includedCovariateIds().join() : '');
			this.isEditPermitted = params.isEditPermitted;
			this.subscriptions.push(this.includedCovariateIds.subscribe(newValue => {
				this.covariateSettings.includedCovariateIds(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));
		}

		conceptsetSelected(d) {
			this.currentConceptSet()(new ConceptSet({id: d.id, name: d.name}));
			this.showConceptSetSelector(false);
		}

		chooseIncludedCovariates() {
			this.showConceptSetSelector(true);
			this.currentConceptSet(this.covariateSettings.includedCovariateConceptSet);
		}
		
		clearIncludedCovariates () {
			this.covariateSettings.includedCovariateConceptSet(new ConceptSet());
		}

		chooseExcludedCovariates() {
			this.showConceptSetSelector(true);
			this.currentConceptSet(this.covariateSettings.excludedCovariateConceptSet);
		}
		
		clearExcludedCovariates () {
			this.covariateSettings.excludedCovariateConceptSet(new ConceptSet());
		}

	}

	return commonUtils.build('prediction-covar-settings-editor', PredictionCovariateSettingsEditor, view);
});