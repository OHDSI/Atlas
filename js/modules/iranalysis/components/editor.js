define(['knockout', 'text!./editor.html','../inputTypes/StudyWindow', '../StratifyRule', 'cohortbuilder/options',
				'conceptsetbuilder/components','cohort-definition-browser', 
				'databindings', 'cohortbuilder/components'
], function (ko, template, StudyWindow, StratifyRule, options) {
	function IRAnalysisEditorModel(params) {
		var self = this;
		self.options = options;
		
		self.analysis = params.analysis;
		self.analysisCohorts = params.analysisCohorts;
		self.loading = ko.observable(false);
		self.showCohortDefinitionBrowser = ko.observable(false);
		self.selectedCohortList = null;
		self.selectedStrataRule = ko.observable();
		self.selectedStrataRuleIndex = null;
		
		self.fieldOptions = [{id: 'StartDate', name: 'start date'}, {id: 'EndDate', name: 'end date'}];
		
		self.addStudyWindow = function() {
			self.analysis().studyWindow(new StudyWindow());
		};
		
		self.addTargetCohort = function() {
			self.selectedCohortList = self.analysis().targetIds;
			self.showCohortDefinitionBrowser(true);
		};

		self.addOutcomeCohort = function() {
			self.selectedCohortList = self.analysis().outcomeIds;
			self.showCohortDefinitionBrowser(true);
		};
		
		self.deleteTargetCohort = function(cohortDef) {
			self.analysis().targetIds.remove(cohortDef.id);	
		};

		self.deleteOutcomeCohort = function(cohortDef) {
			self.analysis().outcomeIds.remove(cohortDef.id);	
		};
		
		self.cohortSelected = function(cohortId) {
			if (self.selectedCohortList().filter(function (item) {
				return cohortId == item;
			}).length == 0)
				self.selectedCohortList.push(cohortId);
		};

		self.copyStrataRule = function(rule) {
				var copiedRule = new StratifyRule(ko.toJS(rule), self.analysis().ConceptSets);
				copiedRule.name("Copy of: " + copiedRule.name());
				self.analysis().strata.push(copiedRule);
				self.selectedStrataRule(copiedRule);
		};
		
		self.deleteStrataRule = function(rule) {
			self.selectedStrataRule(null);
			self.analysis().strata.remove(rule);
		};
	
		self.selectStrataRule = function(rule) {
			self.selectedStrataRule(rule);	
			self.selectedStrataRuleIndex = params.analysis().strata().indexOf(rule);
			console.log("Selected Index: " + self.selectedStrataRuleIndex);
		};
				
		self.addStrataRule = function() {
			var newStratifyRule = new StratifyRule(null, self.analysis().ConceptSets);
			self.analysis().strata.push(newStratifyRule);
			self.selectedStrataRule(newStratifyRule);			
		};
		
		
		// Init actions

		
		// Subscriptions
		
		self.analysisSubscription = self.analysis.subscribe(function (newVal) {
			console.log("New analysis set.");
			self.selectedStrataRule(params.analysis().strata()[self.selectedStrataRuleIndex]);
		});
		
		// Cleanup
		
		self.dispose = function() {
			console.debug && console.debug("IR Analysis Editor Dispose.");
			self.analysisSubscription.dispose();
		};		
	}

	var component = {
		viewModel: IRAnalysisEditorModel,
		template: template
	};

	return component;
});