define(['jquery', 'knockout', 'text!./plp-r-code.html', 'appConfig', 'plp/PatientLevelPredictionAnalysis', 'prism', 'css!./styles/prism.css'],
	function ($, ko, view, config, cohortComparison) {
		function plpRCode(params) {
			var self = this;
			self.config = config;
			self.patientLevelPrediction = params.patientLevelPrediction;
			self.codeElementId = params.codeElementId || 'plp-r-code';
		}

		var component = {
			viewModel: plpRCode,
			template: view
		};

		ko.components.register('plp-r-code', component);
		return component;
	});
