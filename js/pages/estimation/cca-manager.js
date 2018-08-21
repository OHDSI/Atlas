define([
	'knockout', 
	'text!./cca-manager.html',	
	'providers/Component',
	'utils/CommonUtils',
    'appConfig',
    './inputTypes/EstimationAnalysis',
	'./inputTypes/options',
	'./inputTypes/Comparison',
	'./options',
	'faceted-datatable',
	'less!./cca-manager.less',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
    config,
    EstimationAnalysis,
	estimationOptions,
	Comparison,
	uiOptions,
) {
	class ComparativeCohortAnalysisManager extends Component {
		constructor(params) {
            super(params);
            
            this.estimationAnalysis = new EstimationAnalysis();
			this.estimationOptions = estimationOptions;
			this.options = uiOptions.cca;
            this.config = config;
			this.loading = ko.observable(true);
			this.utilityPillMode = ko.observable('print');
			this.specificationPillMode = ko.observable('all');
			this.tabMode = ko.observable('specification');
			this.comparisons = ko.observableArray();
			
			this.estimationAnalysisJson = function() {
				return commonUtils.syntaxHighlight(ko.toJSON(this.estimationAnalysis));
            }

			this.canSave = ko.pureComputed(function () {
                //return (self.cohortComparison().name() && self.cohortComparison().comparatorId() && self.cohortComparison().comparatorId() > 0 && self.cohortComparison().treatmentId() && self.cohortComparison().treatmentId() > 0 && self.cohortComparison().outcomeId() && self.cohortComparison().outcomeId() > 0 && self.cohortComparison().modelType && self.cohortComparison().modelType() > 0 && self.cohortComparisonDirtyFlag() && self.cohortComparisonDirtyFlag().isDirty());
                return false;
			});

			this.canDelete = ko.pureComputed(function () {
                //return (self.cohortComparisonId() && self.cohortComparisonId() > 0);
                return false;
			});

			this.delete = () => {
				if (!confirm("Delete estimation specification? Warning: deletion can not be undone!"))
					return;

                console.warn("Not implemented yet");
                /*
				$.ajax({
					url: config.api.url + 'comparativecohortanalysis/' + self.cohortComparisonId(),
					method: 'DELETE',
					error: function (error) {
						console.log("Error: " + error);
						authApi.handleAccessDenied(error);
					},
					success: function (data) {
						document.location = "#/estimation"
					}
                });
                */
            }

            this.save = () => {
                console.warn("Not implemented yet");
			}
			
			this.load = () => {
				// TODO: Load comparisons these based on the specification
				//this.estimationAnalysis().analysisSpecification().targetComparatorOutcomes().forEach(tco => {
					// Find a cooresponding negative control set for the T/C pair

				//});
				var c1 = new Comparison({
					targetId: 1,
					targetName: "Target Cohort 1",
					comparatorId: 2,
					comparatorName: "Comparator Cohort 1",
					outcomeIds: [100,101,102],
					negativeControlOutcomeIds: [4544234,23234234,234443,12129],
				});
				var c2 = new Comparison({
					targetId: 1,
					targetName: "Target Cohort 2",
					comparatorId: 2,
					comparatorName: "Comparator Cohort 2",
					outcomeIds: [100,101,102,103,104,106,107],
					negativeControlOutcomeIds: [4544234,23234234,234443,12129,23234234,234443,12129],
				});
				// For example
				this.comparisons().push(c1);
				this.comparisons().push(c2);
				this.loading(false);
			}
            
            this.load();
		}
	}

	return commonUtils.build('cca-manager', ComparativeCohortAnalysisManager, view);;
});