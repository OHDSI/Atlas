define([
	'knockout', 
	'text!./CohortMethodAnalysisEditor.html',	
	'providers/Component',
	'utils/CommonUtils',
	'../options',
	'databindings',
	'cyclops',
	'./MatchArgsEditor',
	'./StratifyArgsEditor',
	'./OutcomeModelArgsEditor',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	options,
) {
	class CohortMethodAnalysisEditor extends Component {
		constructor(params) {
            super(params);

			this.analysis = params.analysis;
			this.options = options;
			this.editorMode = ko.observable('all');

			this.trimSelection = ko.observable();
			this.trimSelection.subscribe(newValue => {
				this.analysis.trimByPs(this.trimSelection() == "byPercent");
				this.analysis.trimByPsToEquipoise(this.trimSelection() == "toEquipoise");
				console.log("trimByPs: " + this.analysis.trimByPs() + "; trimByPsToEquipoise: " + this.analysis.trimByPsToEquipoise());
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
				console.log("matchOnPs: " + this.analysis.matchOnPs() + "; matchOnPsAndCovariates: " + this.analysis.matchOnPsAndCovariates() + ";stratifyByPs: " + this.analysis.stratifyByPs() + "; stratifyByPsAndCovariates: " + this.analysis.stratifyByPsAndCovariates());
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
		}
	}

	return commonUtils.build('cohort-method-analysis-editor', CohortMethodAnalysisEditor, view);
});