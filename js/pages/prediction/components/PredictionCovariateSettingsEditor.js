define([
	'knockout', 
	'text!./PredictionCovariateSettingsEditor.html',	
	'components/Component',
	'utils/CommonUtils',
	'utils/DataTypeConverterUtils',
	'../options',
	'../inputTypes/ConceptSet',
	'databindings',
	'featureextraction/components/CovariateSettingsEditor',
	'circe',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	dataTypeConverterUtils,
	options,
	ConceptSet,
) {
	class PredictionCovariateSettingsEditor extends Component {
		constructor(params) {
			super(params);
			
			this.covariateSettings = params.covariateSettings;
			this.options = options;
			this.showConceptSetSelector = ko.observable(false);
			this.includedCovariateIds = ko.observable(this.covariateSettings.includedCovariateIds() && this.covariateSettings.includedCovariateIds().length > 0 ? this.analysis.getDbCohortMethodDataArgs.covariateSettings.includedCovariateIds().join() : '');

			this.includedCovariateIds.subscribe(newValue => {
				this.covariateSettings.includedCovariateIds(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			});
		}

		conceptsetSelected(d) {
			this.currentConceptSet(new ConceptSet({id: d.id, name: d.name}));
			this.showConceptSetSelector(false);
		}

		chooseIncludedCovariates() {
			this.showConceptSetSelector(true);
			this.currentConceptSet = this.covariateSettings.includedCovariateConceptSet;
		}
		
		clearIncludedCovariates () {
			this.covariateSettings.includedCovariateConceptSet(new ConceptSet());
		}

		chooseExcludedCovariates() {
			this.showConceptSetSelector(true);
			this.currentConceptSet = this.covariateSettings.excludedCovariateConceptSet;
		}
		
		clearExcludedCovariates () {
			this.covariateSettings.excludedCovariateConceptSet(new ConceptSet());
		}

	}

	return commonUtils.build('prediction-covar-settings-editor', PredictionCovariateSettingsEditor, view);
});