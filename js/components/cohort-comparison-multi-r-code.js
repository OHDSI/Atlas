define([
	'knockout',
	'text!./cohort-comparison-multi-r-code.html',
	'appConfig',
	'components/cohortcomparison/ComparativeCohortAnalysis',
	'services/VocabularyProvider',
],
	function (
		ko,
		view,
		config,
		cohortComparison,
		vocabularyAPI,
		options
	) {
		function cohortComparisonMultiRCode(params) {
			var self = this;
			self.config = config;
			self.cohortComparison = params.cohortComparison;            
			self.codeElementId = params.codeElementId || 'estimation-r-code';
		}

		var component = {
			viewModel: cohortComparisonMultiRCode,
			template: view
		};

		ko.components.register('cohort-comparison-multi-r-code', component);
		return component;
	});