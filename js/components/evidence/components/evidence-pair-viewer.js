define([
	'knockout',
	'text!./evidence-pair-viewer.html',
	'appConfig',
	'webapi/AuthAPI',
	'webapi/EvidenceAPI',
], function (
	ko,
	view,
	config,
	authApi,
	evidenceAPI
) {
	function evidencePairViewer(params) {
		var self = this;
		self.model = params.model;
		self.sourceKey = params.sourceKey || ko.observable("CEM-APS");
		self.targetDomainId = params.targetDomainId || ko.observable('CONDITION');
		self.drugConceptIds = params.drugConceptIds || ko.observableArray([42904205]);
		self.conditionConceptIds = params.conditionConceptIds || ko.observableArray([4093145]);
		self.sourceIds = params.sourceIds || ko.observableArray(['medline_winnenburg','splicer']);
		self.drugConditionPairs = ko.observableArray();
		self.loading = ko.observable(true);

		self.loadDrugConditionPairs = function() { 
			self.loading(true);

			evidenceAPI.getDrugConditionPairs(self.sourceKey(), self.targetDomainId(), self.drugConceptIds(), self.conditionConceptIds(), self.sourceIds())
				.done(function (results) {
					self.drugConditionPairs(results);
					self.loading(false);
				})
				.fail(function (err) {
					console.log(err);
				});
		}

		// startup actions
		self.loadDrugConditionPairs();
	}

	var component = {
		viewModel: evidencePairViewer,
		template: view
	};

	return component;
});