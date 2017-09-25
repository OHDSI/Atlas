define(['jquery', 'knockout', 'text!./cohort-comparison-multi-r-code.html', 'appConfig', 'cohortcomparison/ComparativeCohortAnalysis', 'prism', 'css!./styles/prism.css'],
	function ($, ko, view, config, cohortComparison) {
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
