define([
	'knockout', 
	'text!./cca-specification-view-edit.html',	
	'utils/AutoBind',
	'components/Component',
	'utils/CommonUtils',
	'../inputTypes/ComparativeCohortAnalysis/CohortMethodAnalysis',
	'../inputTypes/Comparison',
	'../const',
	'./editors/comparison-editor',
	'./editors/cohort-method-analysis-editor',
	'./editors/negative-control-outcome-cohort-settings-editor',
	'./editors/positive-control-sythesis-settings-editor',
], function (
	ko, 
	view, 
	AutoBind,
	Component,
	commonUtils,
	CohortMethodAnalysis,
	Comparison,
	constants,
) {
	class ComparativeCohortAnalysisSpecificationViewEdit extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.specificationPillMode = ko.observable('all');
			this.comparisons = params.comparisons;
			this.cohortMethodAnalysisList = params.estimationAnalysis().estimationAnalysisSettings.analysisSpecification.cohortMethodAnalysisList;
			this.subscriptions = params.subscriptions;
			this.editorComponentName = ko.observable(null);
			this.editorComponentParams = ko.observable({});
			this.editorDescription = ko.observable();
			this.editorHeading = ko.observable();
			this.editorArray = ko.observableArray();
			this.estimationAnalysis = params.estimationAnalysis;
			this.options = constants.options;
			this.loading = params.loading;
			this.managerMode = ko.observable('summary');
			this.defaultCovariateSettings = params.defaultCovariateSettings;
		}

		comparisonTableRowClickHandler(data, obj, tableRow, rowIndex) {
			if (
				obj.target.className.indexOf("btn-remove") >= 0 ||
				obj.target.className.indexOf("fa-times") >= 0
			) {
				this.deleteFromTable(this.comparisons, obj, rowIndex);
			} else if (
				obj.target.className.indexOf("btn-copy") >= 0 ||
				obj.target.className.indexOf("fa-clone") >= 0
			) {
				this.copyComparison(obj, rowIndex);
			} else {
				this.editComparison(data);
			}
		}

		analysisSettingsTableRowClickHandler(data, obj, tableRow, rowIndex) {
			if (
				obj.target.className.indexOf("btn-remove") >= 0 ||
				obj.target.className.indexOf("fa-times") >= 0
			) {
				this.deleteFromTable(this.cohortMethodAnalysisList, obj, rowIndex);
			} else if (
				obj.target.className.indexOf("btn-copy") >= 0 ||
				obj.target.className.indexOf("fa-clone") >= 0
			) {
				this.copyAnalysisSettings(obj, rowIndex);
			} else {
				this.editAnalysis(data);
			}
		}

		addAnalysis() {
			this.cohortMethodAnalysisList.push(
				new CohortMethodAnalysis({description: "New analysis " + (this.cohortMethodAnalysisList().length + 1)}, this.defaultCovariateSettings())
			);
			// Get the index
			const index = this.cohortMethodAnalysisList().length - 1;
			this.editAnalysis(this.cohortMethodAnalysisList()[index]);
		}

		editAnalysis(analysis) {
			this.editorArray = this.cohortMethodAnalysisList;
			this.editorHeading('Analysis Settings');
			this.editorDescription('Add or update the analysis settings');
			this.editorComponentName('cohort-method-analysis-editor');
			this.editorComponentParams({ 
				analysis: analysis,
				subscriptions: this.subscriptions,
			});
			this.managerMode('editor')
		}

		copyAnalysisSettings(obj, index) {
			const newAnalysis = ko.toJS(this.cohortMethodAnalysisList()[index]);
			newAnalysis.analysisId = this.cohortMethodAnalysisList().length + 1;
			newAnalysis.description = "COPY OF: " + newAnalysis.description;
			this.cohortMethodAnalysisList.push(new CohortMethodAnalysis(newAnalysis));
		}

		addComparison() {
			this.comparisons.push(
				new Comparison()
			);
			// Get the index
			var index = this.comparisons().length - 1;
			this.editComparison(this.comparisons()[index]);
		}

		editComparison(comparison) {
			this.editorArray = this.comparisons;
			this.editorHeading('Comparison');
			this.editorDescription('Add or update the target, comparator, outcome(s) cohorts and negative control outcomes');
			this.editorComponentName('comparison-editor');
			this.editorComponentParams({ 
				comparison: comparison,
				subscriptions: this.subscriptions,
			});
			this.managerMode('editor')
		}

		copyComparison(obj, index) {
			const newComparison = ko.toJS(this.comparisons()[index]);
			newComparison.target = null;
			newComparison.comparator = null;
			this.comparisons.push(new Comparison(newComparison));
		}

		deleteFromTable(list, obj, index) {
			// Check if the button or inner element were clicked
			if (
				obj.target.className.indexOf("btn-remove") >= 0 ||
				obj.target.className.indexOf("fa-times") >= 0
			) {
				list.splice(index, 1);
			}
		}

		closeEditor() {
			this.editorArray.valueHasMutated();
			this.managerMode('summary');
		}
	}

	return commonUtils.build('comparative-cohort-analysis-specification-view-edit', ComparativeCohortAnalysisSpecificationViewEdit, view);
});