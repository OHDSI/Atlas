define([
	'knockout', 
	'text!./cca-utilities.html',	
	'components/Component',
	'utils/CommonUtils',
	'services/file',
	'appConfig',
	'services/Estimation',
	'../PermissionService',
	'../const',
	'clipboard',
	'../inputTypes/ComparativeCohortAnalysis/FullAnalysis',
	'services/analysis/Cohort',
	'../inputTypes/TargetComparatorOutcome',
	'faceted-datatable',
	'utilities/import',
	'utilities/export',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	fileService,
	config,
	EstimationService,
	PermissionService,
	constants,
	clipboard,
	FullAnalysis,
	Cohort,
	TargetComparatorOutcome,
) {
	class ComparativeCohortAnalysisUtilities extends Component {
		constructor(params) {
			super(params);

			this.utilityPillMode = ko.observable('download');
			this.defaultLoadingMessage = "Loading...";
			this.constants = constants;
			this.options = constants.options;
			this.cohortMethodAnalysisList = params.estimationAnalysis().estimationAnalysisSettings.analysisSpecification.cohortMethodAnalysisList;
			this.comparisons = params.comparisons;
			this.dirtyFlag = params.dirtyFlag;
			this.isExporting = ko.observable(false);			
			this.fullAnalysisList = params.fullAnalysisList;
			this.fullSpecification = params.fullSpecification;
			this.loading = params.loading;
			this.subscriptions = params.subscriptions;
			this.loadingDownload = ko.observable(false);
			this.loadingMessage = params.loadingMessage;
			this.packageName = params.packageName;
			this.selectedAnalysisId = params.estimationId;
			this.exportService = EstimationService.exportEstimation;
			this.importService = EstimationService.importEstimation;
			this.isPermittedExport = PermissionService.isPermittedExport;
			this.isPermittedImport = PermissionService.isPermittedImport;

			this.specificationMeetsMinimumRequirements = ko.pureComputed(() => {
				return (
					this.comparisons().length > 0 &&
					(this.cohortMethodAnalysisList != null && this.cohortMethodAnalysisList().length > 0)
				);
			});

			this.specificationHasFullComparisons = ko.pureComputed(() => {
				var result = this.specificationMeetsMinimumRequirements(); 
				if (result) {
					for(var i = 0; i < this.comparisons().length; i++) {
						var currentComparison = this.comparisons()[i];
						if (currentComparison.target().id == 0 || currentComparison.comparator().id == 0 || currentComparison.outcomes().length == 0) {
							result = false;
							break;
						}
					}
				}
				return result;
			});

			this.specificationHasUniqueSettings = ko.pureComputed(() => {
				var result = this.specificationMeetsMinimumRequirements() && this.specificationHasFullComparisons();
				if (result) {
					// Check to make sure the other settings are unique
					var uniqueComparisons = new Set(this.comparisons().map((c) => { return (c.target().id + ',' + c.comparator().id) }));
					var uniqueAnalysisList = new Set(this.cohortMethodAnalysisList().map((a) => { return ko.toJSON(a)}));
					result = (
							this.comparisons().length == uniqueComparisons.size &&
							this.cohortMethodAnalysisList().length == uniqueAnalysisList.size
					)
				}
				return result;
			});

			this.specificationValid = ko.pureComputed(() => {
				return (
					this.specificationMeetsMinimumRequirements() && 
					this.specificationHasFullComparisons() &&
					this.specificationHasUniqueSettings()
				)
			});

			this.validPackageName = ko.pureComputed(() => {
				return (this.packageName() && this.packageName().length > 0)
			});

			this.subscriptions.push(this.utilityPillMode.subscribe(() => {
				if (this.utilityPillMode()  == 'download') {
					this.computeCartesian();
				}
			}));

			// Fire the subscription upon load.
			this.utilityPillMode.valueHasMutated();
		}

		computeCartesian() {
			// Init
			this.loadingDownload(true);
			this.fullAnalysisList.removeAll();

			// Explode T+C for all O's
			var fullComparisonList = [];
			this.comparisons().forEach((tcos) => {
				tcos.outcomes().forEach((outcome) => {
					fullComparisonList.push(new TargetComparatorOutcome({
						target: tcos.target(), 
						comparator: tcos.comparator(), 
						outcome: new Cohort(outcome),
					}))
				});
			})

			// Full Analysis
			var fullAnalysisCartesian = commonUtils.cartesian(
				fullComparisonList,
				this.cohortMethodAnalysisList(),
			);
			fullAnalysisCartesian.forEach(element => {
				if (element.length != 2) {
					console.error("Expecting array with index 0: TargetComparatorOutcome, 1: CohortMethodAnalysis");
				} else {
					this.fullAnalysisList().push(
						new FullAnalysis(element[0],element[1])
					);
				}
			});
			this.fullAnalysisList.valueHasMutated();
			this.loadingDownload(false);
		}

		downloadPackage() {
			this.loadingMessage("Starting download...");
			this.loading(true);
			fileService.loadZip(
				config.api.url + constants.apiPaths.downloadCcaAnalysisPackage(this.selectedAnalysisId(), this.packageName()),
				`estimation_study_${this.selectedAnalysisId()}_export.zip`
			)
			.catch((e) => console.error("error when downloading: " + e))
			.finally(() => this.loading(false));
		}

		copyFullSpecificationToClipboard() {
			var currentClipboard = new clipboard('#btnCopyFullSpecificationClipboard');

			currentClipboard.on('success', function (e) {
				e.clearSelection();
				$('#copyFullSpecificationToClipboardMessage').fadeIn();
				setTimeout(function () {
					$('#copyFullSpecificationToClipboardMessage').fadeOut();
				}, 1500);
			});

			currentClipboard.on('error', function (e) {
				console.error('Error copying to clipboard');
			});			
		}		
	}

	return commonUtils.build('comparative-cohort-analysis-utilities', ComparativeCohortAnalysisUtilities, view);
});