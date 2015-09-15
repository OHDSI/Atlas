define(['knockout', 'text!./cohort-definition-manager.html', 'knockout.dataTables.binding'], function (ko, view) {
	function cohortDefinitionManager(params) {
		var self = this;
		self.model = params.model;

		self.tabMode = ko.observable('definition');
		
		self.generateAnalyses = function (data, event) {
			console.log(event.target);
			$(event.target).prop("disabled", true);

			var requestedAnalysisTypes = [];
			$('input[type="checkbox"][name="' + data.sourceKey + '"]:checked').each(function () {
				requestedAnalysisTypes.push($(this).val());
			});
			var analysisIdentifiers = [];

			var analysesTypes = pageModel.cohortAnalyses();
			for (var i = 0; i < analysesTypes.length; i++) {
				if (requestedAnalysisTypes.indexOf(analysesTypes[i].name) >= 0) {
					for (var j = 0; j < analysesTypes[i].analyses.length; j++) {
						analysisIdentifiers.push(analysesTypes[i].analyses[j].analysisId);
					}
				}
			}

			if (analysisIdentifiers.length > 0) {
				$(event.target).prop('value', 'Starting job...');
				var cohortDefinitionId = pageModel.currentCohortDefinition().id;
				var cohortJob = {};

				cohortJob.jobName = 'HERACLES' + '_COHORT_' + cohortDefinitionId + '_' + data.sourceKey;
				cohortJob.sourceKey = data.sourceKey;
				cohortJob.smallCellCount = 5;
				cohortJob.cohortDefinitionIds = [];
				cohortJob.cohortDefinitionIds.push(cohortDefinitionId);
				cohortJob.analysisIds = analysisIdentifiers;
				cohortJob.runHeraclesHeel = false;
				cohortJob.cohortPeriodOnly = false;

				// set concepts
				cohortJob.conditionConceptIds = [];
				cohortJob.drugConceptIds = [];
				cohortJob.procedureConceptIds = [];
				cohortJob.observationConceptIds = [];
				cohortJob.measurementConceptIds = [];

				console.log("Submitting to cohort analysis service:");
				console.log(cohortJob);

				$.ajax({
					url: pageModel.services()[0].url + 'cohortanalysis',
					data: JSON.stringify(cohortJob),
					method: 'POST',
					contentType: 'application/json',
					success: function (info) {
						console.log(info);
					}
				});
			} else {
				$(event.target).prop("disabled", false);
			}
		}

		self.hasCDM = function (source) {
			for (var d = 0; d < source.daimons.length; d++) {
				if (source.daimons[d].daimonType == 'CDM') {
					return true;
				}
			}
			return false;
		}

		self.hasResults = function (source) {
			for (var d = 0; d < source.daimons.length; d++) {
				if (source.daimons[d].daimonType == 'Results') {
					return true;
				}
			}
			return false;
		}
	}

	var component = {
		viewModel: cohortDefinitionManager,
		template: view
	};

	ko.components.register('cohort-definition-manager', component);
	return component;
});
