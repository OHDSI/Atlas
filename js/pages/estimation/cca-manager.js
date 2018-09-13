define([
	'knockout', 
	'text!./cca-manager.html',	
	'providers/Component',
	'utils/CommonUtils',
    'appConfig',
    './inputTypes/EstimationAnalysis',
    './inputTypes/ComparativeCohortAnalysis/CohortMethodAnalysis',
	'./inputTypes/Comparison',
	'./inputTypes/Cohort',
	'./options',
	'faceted-datatable',
	'./components/ComparisonEditor',
	'./components/CohortMethodAnalysisEditor',
	'./components/NegativeControlOutcomeCohortSettingsEditor',
	'./components/PositiveControlSythesisSettingsEditor',
	'less!./cca-manager.less',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
    config,
	EstimationAnalysis,
	CohortMethodAnalysis,
	Comparison,
	Cohort,
	options,
) {
	class ComparativeCohortAnalysisManager extends Component {
		constructor(params) {
            super(params);
            
			this.estimationAnalysis = new EstimationAnalysis();
			this.cohortMethodAnalysisList = this.estimationAnalysis.estimationAnalysisSettings.analysisSpecification.cohortMethodAnalysisList;
			this.options = options;
            this.config = config;
			this.loading = ko.observable(true);
			this.utilityPillMode = ko.observable('print');
			this.specificationPillMode = ko.observable('all');
			this.tabMode = ko.observable('specification');
			this.comparisons = ko.observableArray();
			this.managerMode = ko.observable('summary');
			this.editorComponentName = ko.observable(null);
			this.editorComponentParams = ko.observable({});
			this.editorDescription = ko.observable();
			this.editorHeading = ko.observable();
			
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

			this.addAnalysis = () => {
				this.cohortMethodAnalysisList.push(
					new CohortMethodAnalysis({description: "New analysis"})
				);
				// Get the index
				var index = this.cohortMethodAnalysisList().length - 1;
				this.editAnalysis(this.cohortMethodAnalysisList()[index]);
			}

			this.editAnalysis = (analysis) => {
				this.editorHeading('Analysis Settings');
				this.editorDescription('Add or update the analysis settings');
				this.editorComponentName('cohort-method-analysis-editor');
				this.editorComponentParams({ 
					analysis: analysis,
				});
				this.managerMode('editor')
			}

			this.analysisSettingsTableRowClickHandler = (data, obj, tableRow, rowIndex) => {
				if (
					obj.target.className.indexOf("btn-remove") >= 0 ||
					obj.target.className.indexOf("fa-times") >= 0
				) {
					this.deleteFromTable(this.cohortMethodAnalysisList, obj, rowIndex);
				} else {
					this.editAnalysis(data);
				}
			}

			this.addComparison = () => {
				this.comparisons.push(
					new Comparison()
				);
				// Get the index
				var index = this.comparisons().length - 1;
				this.editComparison(this.comparisons()[index]);
			}

			this.editComparison = (comparison) => {
				this.editorHeading('Comparison');
				this.editorDescription('Add or update the target, comparator, outcome(s) cohorts and negative control outcomes');
				this.editorComponentName('comparison-editor');
				this.editorComponentParams({ 
					comparison: comparison,
				});
				this.managerMode('editor')
			}

			this.comparisonTableRowClickHandler = (data, obj, tableRow, rowIndex) => {
				if (
					obj.target.className.indexOf("btn-remove") >= 0 ||
					obj.target.className.indexOf("fa-times") >= 0
				) {
					this.deleteFromTable(this.comparisons, obj, rowIndex);
				} else {
					this.editComparison(data);
				}
			}

			this.deleteFromTable = (list, obj, index) => {
				// Check if the button or inner element were clicked
				if (
					obj.target.className.indexOf("btn-remove") >= 0 ||
					obj.target.className.indexOf("fa-times") >= 0
				) {
					list.splice(index, 1);
				}
			}

			
			this.load = () => {
				// TODO: Load comparisons these based on the specification
				//this.estimationAnalysis().analysisSpecification().targetComparatorOutcomes().forEach(tco => {
					// Find a cooresponding negative control set for the T/C pair

				//});
				var c1 = new Comparison({
					target: {id: 1, name: "Target Cohort 1"},
					comparator: {id: 1, name: "Comparator Cohort 1"},
					outcomes: [
						{id: 100, name: "Outcome Cohort 1"},
						{id: 101, name: "Outcome Cohort 2"},
						{id: 102, name: "Outcome Cohort 3"},
					],
					negativeControlOutcomes: {id: 1, name: 'Negative Control Concept Set 1'},
				});
				var c2 = new Comparison({
					target: {id: 1, name: "Target Cohort 2"},
					comparator: {id: 1, name: "Comparator Cohort 2"},
					outcomes: [
						{id: 100, name: "Outcome Cohort 4"},
						{id: 101, name: "Outcome Cohort 5"},
						{id: 102, name: "Outcome Cohort 6"},
						{id: 103, name: "Outcome Cohort 7"},
						{id: 104, name: "Outcome Cohort 8"},
						{id: 105, name: "Outcome Cohort 9"},
						{id: 106, name: "Outcome Cohort 10"},
						{id: 107, name: "Outcome Cohort 11"},
					],
					negativeControlOutcomes: {id: 1, name: 'Negative Control Concept Set 2'},
				});
				// For example
				this.comparisons().push(c1);
				this.comparisons().push(c2);
				this.loading(false);
			}

			this.closeEditor = () => {
				this.managerMode('summary');
			}
            
            this.load();
		}
	}

	return commonUtils.build('cca-manager', ComparativeCohortAnalysisManager, view);;
});