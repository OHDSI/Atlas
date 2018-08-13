define(['jquery', 'knockout', 'text!./plp-print-friendly.html', 'appConfig', 'plp/PatientLevelPredictionAnalysis'],
	function ($, ko, view, config, cohortComparison) {
		function plpPrintFriendly(params) {
			var self = this;
			self.config = config;
			self.loading = ko.observable(true);
			self.patientLevelPrediction = params.patientLevelPrediction;
		}

		var component = {
			viewModel: plpPrintFriendly,
			template: view
		};

		ko.components.register('plp-print-friendly', component);
		return component;
	});
