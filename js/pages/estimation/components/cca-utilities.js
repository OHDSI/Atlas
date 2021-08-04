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
			this.defaultLoadingMessage = ko.i18n('common.loadingWithDots', 'Loading...')();
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
			this.criticalCount = params.criticalCount;
			this.exportService = EstimationService.exportEstimation;
			this.importService = EstimationService.importEstimation;
			this.isPermittedExport = PermissionService.isPermittedExport;
			this.isPermittedImport = PermissionService.isPermittedImport;
			this.isEditPermitted = params.isEditPermitted;
			this.afterImportSuccess = params.afterImportSuccess;
			this.cca = constants.getCca(this.isEditPermitted())[0];

			this.specificationValid = ko.pureComputed(() => this.criticalCount() <= 0);

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