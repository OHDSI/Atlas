define([
	'knockout', 
	'text!./PredictionCovariateSettingsEditor.html',	
	'providers/Component',
	'utils/CommonUtils',
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
	options,
	ConceptSet,
) {
	class PredictionCovariateSettingsEditor extends Component {
		constructor(params) {
			super(params);
			
			this.covariateSettings = params.covariateSettings;
			this.options = options;
			this.showConceptSetSelector = ko.observable(false);

			if (this.covariateSettings.includedCovariateConceptSet().id === undefined) {
				this.covariateSettings.includedCovariateConceptSet(new ConceptSet());
			}
			if (this.covariateSettings.excludedCovariateConceptSet().id === undefined) {
				this.covariateSettings.excludedCovariateConceptSet(new ConceptSet());
			}

		}

		conceptsetSelected(d) {
			console.log(d.id + ": " + d.name);
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