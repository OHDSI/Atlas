define([
	'knockout',
	'text!./editor.html',
	'pages/incidence-rates/inputTypes/StudyWindow',
	'../StratifyRule',
	'components/cohortbuilder/options',
	'components/Component',
	'utils/AutoBind',	
	'utils/CommonUtils',
	'conceptsetbuilder/components',
	'components/cohort-definition-browser',				
	'databindings',
	'components/cohortbuilder/components',
	'less!./editor.less',
], function (
	ko,
	view,
	StudyWindow,
	StratifyRule,
	options,
	Component,
	AutoBind,
	commonUtils,
) {
	class IRAnalysisEditorModel extends AutoBind(Component) {
		constructor(params) {
			super(params);					
			this.options = options;
			
			this.analysis = params.analysis;
			this.analysisCohorts = params.analysisCohorts;
			this.loading = ko.observable(false);
			this.showCohortDefinitionBrowser = ko.observable(false);
			this.selectedCohortList = null;
			this.selectedStrataRule = ko.observable();
			this.selectedStrataRuleIndex = null;
			this.isEditable = params.isEditable;

			this.fieldOptions = [{id: 'StartDate', name: 'start date'}, {id: 'EndDate', name: 'end date'}];
			// Subscriptions
			this.subscriptions.push(this.analysis.subscribe((newVal) => {
				console.log("New analysis set.");
				this.selectedStrataRule(params.analysis().strata()[this.selectedStrataRuleIndex]);
			}));
		}
			
		addStudyWindow() {
			this.analysis().studyWindow(new StudyWindow());
		};
		
		addTargetCohort() {
			this.selectedCohortList = this.analysis().targetIds;
			this.showCohortDefinitionBrowser(true);
		};

		addOutcomeCohort() {
			this.selectedCohortList = this.analysis().outcomeIds;
			this.showCohortDefinitionBrowser(true);
		};
		
		deleteTargetCohort(cohortDef) {
			this.analysis().targetIds.remove(cohortDef.id);
		};

		deleteOutcomeCohort(cohortDef) {
			this.analysis().outcomeIds.remove(cohortDef.id);
		};
		
		cohortSelected(cohortId) {
			if (this.selectedCohortList().filter((item) => {
				return cohortId == item;
			}).length == 0)
				this.selectedCohortList.push(cohortId);
		};

		copyStrataRule(rule) {
				var copiedRule = new StratifyRule(ko.toJS(rule), this.analysis().ConceptSets);
				copiedRule.name("Copy of: " + copiedRule.name());
				this.analysis().strata.push(copiedRule);
				this.selectedStrataRule(copiedRule);
		};
		
		deleteStrataRule(rule) {
			this.selectedStrataRule(null);
			this.analysis().strata.remove(rule);
		};
	
		selectStrataRule(rule) {
			this.selectedStrataRule(rule);	
			this.selectedStrataRuleIndex = params.analysis().strata().indexOf(rule);
			console.log("Selected Index: " + this.selectedStrataRuleIndex);
		};
				
		addStrataRule() {
			var newStratifyRule = new StratifyRule(null, this.analysis().ConceptSets);
			this.analysis().strata.push(newStratifyRule);
			this.selectedStrataRule(newStratifyRule);			
		};
		
		dispose() {
			super.dispose();
			console.debug && console.debug("IR Analysis Editor Dispose.");
		};
	}

	return commonUtils.build('ir-analysis-editor', IRAnalysisEditorModel, view);
});