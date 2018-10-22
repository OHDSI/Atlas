define([
	'jquery',
	'knockout',
	'text!./cohort-comparison-r-code.html',
	'appConfig',
	'components/cohortcomparison/ComparativeCohortAnalysis',
	'services/VocabularyProvider',
	'prism',
],
	function (
		$,
		ko,
		view,
		config,
		cohortComparison,
		vocabularyAPI,
		options
	) {
		function cohortComparisonRCode(params) {
			var self = this;
			self.config = config;
			self.cohortComparison = params.cohortComparison;            
		}

		var component = {
			viewModel: cohortComparisonRCode,
			template: view
		};

		ko.components.register('cohort-comparison-r-code', component);
		return component;
	});