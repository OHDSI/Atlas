define([
	'knockout', 
	'text!./CohortMethodAnalysisEditor.html',	
	'providers/Component',
	'utils/CommonUtils',
	'../options',
	'../inputTypes/ConceptSet',
	'databindings',
	'cyclops',
	'./MatchArgsEditor',
	'./StratifyArgsEditor',
	'./OutcomeModelArgsEditor',
	'featureextraction/components/CovariateSettingsEditor',
	'components/cohort-definition-browser',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	options,
	ConceptSet,
) {
	class CohortMethodAnalysisEditor extends Component {
		constructor(params) {
            super(params);

			this.analysis = params.analysis;
			this.options = options;
			this.editorMode = ko.observable('all');
			this.showCovariateSelector = ko.observable(false);
			this.showControlDisplay = ko.observable(false);
			this.showPriorDisplay = ko.observable(false);
			this.showConceptSetSelector = ko.observable(false);
			this.showPsCovariateDisplay = ko.observable(false);
			this.currentConceptSet = null;
	
			this.trimSelection = ko.observable();
			this.trimSelection.subscribe(newValue => {
				this.analysis.trimByPs(this.trimSelection() == "byPercent");
				this.analysis.trimByPsToEquipoise(this.trimSelection() == "toEquipoise");
			});
			// Initialize trimSelection
			if (this.analysis.trimByPs()) {
				this.trimSelection("byPercent")
			} else if (this.analysis.trimByPsToEquipoise()) {
				this.trimSelection("toEquipoise")
			} else {
				this.trimSelection("none")
			}
			
			this.matchStratifySelection = ko.observable();
			this.matchStratifySelection.subscribe(newValue => {
				this.analysis.matchOnPs(this.matchStratifySelection() == "matchOnPs");
				this.analysis.matchOnPsAndCovariates(this.matchStratifySelection() == "matchOnPsAndCovariates");
				this.analysis.stratifyByPs(this.matchStratifySelection() == "stratifyByPs");
				this.analysis.stratifyByPsAndCovariates(this.matchStratifySelection() == "stratifyOnPsAndCovariates");
			})
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

			if (this.analysis.getDbCohortMethodDataArgs.covariateSettings.includedCovariateConceptSet().id === undefined) {
				this.analysis.getDbCohortMethodDataArgs.covariateSettings.includedCovariateConceptSet(new ConceptSet());
			}
			if (this.analysis.getDbCohortMethodDataArgs.covariateSettings.excludedCovariateConceptSet().id === undefined) {
				this.analysis.getDbCohortMethodDataArgs.covariateSettings.excludedCovariateConceptSet(new ConceptSet());
			}
		}

		toggleControlDisplay() {
			this.showControlDisplay(!this.showControlDisplay());
		}
	
		togglePriorDisplay() {
			this.showPriorDisplay(!this.showPriorDisplay());
		}

		conceptsetSelected(d) {
			this.currentConceptSet(new ConceptSet({id: d.id, name: d.name}));
			this.showConceptSetSelector(false);
		}

		chooseIncludedCovariates() {
			this.showConceptSetSelector(true);
			this.currentConceptSet = this.analysis.getDbCohortMethodDataArgs.covariateSettings.includedCovariateConceptSet;
		}
		
		clearIncludedCovariates () {
			this.analysis.getDbCohortMethodDataArgs.covariateSettings.includedCovariateConceptSet(new ConceptSet());
		}

		chooseExcludedCovariates() {
			this.showConceptSetSelector(true);
			this.currentConceptSet = this.analysis.getDbCohortMethodDataArgs.covariateSettings.excludedCovariateConceptSet;
		}
		
		clearExcludedCovariates () {
			this.analysis.getDbCohortMethodDataArgs.covariateSettings.excludedCovariateConceptSet(new ConceptSet());
		}

		togglePsCovariateDisplay() {
			this.showPsCovariateDisplay(!this.showPsCovariateDisplay());
		}
	
	}

	return commonUtils.build('cohort-method-analysis-editor', CohortMethodAnalysisEditor, view);
});