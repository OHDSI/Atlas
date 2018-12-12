define([
	'knockout', 
	'text!./cca-manager.html',	
	'components/Component',
	'utils/CommonUtils',
	'services/file',
	'assets/ohdsi.util',
	'appConfig',
	'./const',
	'atlas-state',	
	'clipboard',
	'./PermissionService',
	'services/Estimation',
    './inputTypes/EstimationAnalysis',
    './inputTypes/ComparativeCohortAnalysis/CohortMethodAnalysis',
	'./inputTypes/Comparison',
	'./inputTypes/ConceptSet',
	'./inputTypes/TargetComparatorOutcomes',
	'./inputTypes/ConceptSetCrossReference',
	'./inputTypes/Cohort',
	'./inputTypes/TargetComparatorOutcome',
	'featureextraction/InputTypes/CovariateSettings',
	'./inputTypes/ComparativeCohortAnalysis/FullAnalysis',
	'services/FeatureExtraction',
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
	fileService,
	ohdsiUtil,
	config,
	constants,
	sharedState,
	clipboard,
	PermissionService,
	EstimationService,
	EstimationAnalysis,
	CohortMethodAnalysis,
	Comparison,
	ConceptSet,
	TargetComparatorOutcomes,
	ConceptSetCrossReference,
	Cohort,
	TargetComparatorOutcome,
	CovariateSettings,
	FullAnalysis,
	FeatureExtractionService,
	options,
) {
	class ComparativeCohortAnalysisManager extends Component {
		constructor(params) {
            super(params);
			
			this.defaultLoadingMessage = "Loading...";
			this.estimationType = 'ComparativeCohortAnalysis';
			this.cohortMethodAnalysisList = null;
			this.defaultCovariateSettings = null;
			this.options = options;
            this.config = config;
			this.loading = ko.observable(true);
			this.estimationAnalysis = sharedState.estimationAnalysis.current;
			this.selectedAnalysisId = sharedState.estimationAnalysis.selectedId;
			this.dirtyFlag = sharedState.estimationAnalysis.dirtyFlag;
			this.utilityPillMode = ko.observable('download');
			this.specificationPillMode = ko.observable('all');
			this.tabMode = ko.observable('specification');
			this.comparisons = sharedState.estimationAnalysis.comparisons;
			this.managerMode = ko.observable('summary');
			this.editorComponentName = ko.observable(null);
			this.editorComponentParams = ko.observable({});
			this.editorDescription = ko.observable();
			this.editorHeading = ko.observable();
			this.loadingDownload = ko.observable(false);
			this.fullAnalysisList = ko.observableArray();
			this.fullSpecification = ko.observable(null);
			this.isExporting = ko.observable(false);
			this.loadingMessage = ko.observable(this.defaultLoadingMessage);
			this.packageName = ko.observable();

			this.canSave = ko.pureComputed(() => {
				return this.dirtyFlag().isDirty() && this.estimationAnalysis() && this.estimationAnalysis().name();
			});

			this.canDelete = ko.pureComputed(() => {
				return PermissionService.isPermittedDelete(this.selectedAnalysisId());
			});

			this.canCopy = ko.pureComputed(() => {
				return PermissionService.isPermittedCopy(this.selectedAnalysisId());
			});

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
			this.populationCaption = ko.computed(() => {
				if (this.estimationAnalysis()) {
					if (this.selectedAnalysisId() === '0') {
						return 'New Population Level Effect Estimation - Comparative Cohort Analysis';
					} else {
						return 'Population Level Effect Estimation - Comparative Cohort Analysis #' + this.selectedAnalysisId();
					}
				}
			});
			this.showNameWarning = ko.computed(() => {
				return !(this.estimationAnalysis() && (this.estimationAnalysis().name()));
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

			this.comparisonTableRowClickHandler = (data, obj, tableRow, rowIndex) => {
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

			this.analysisSettingsTableRowClickHandler = (data, obj, tableRow, rowIndex) => {
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
	
			this.init();
		}
		
		delete() {
			if (!confirm("Delete estimation specification? Warning: deletion can not be undone!"))
				return;

			EstimationService.deleteEstimation(this.selectedAnalysisId()).then((analysis) => {
				this.loading(true);
				this.estimationAnalysis(null);
				this.selectedAnalysisId(null);
				this.comparisons.removeAll();
				this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.estimationAnalysis()));
				document.location = constants.apiPaths.browser()
			});
		}

		save() {
			this.loading(true);
			this.fullAnalysisList.removeAll();
			var payload = this.prepForSave();
			EstimationService.saveEstimation(payload).then((analysis) => {
				this.loadAnalysisFromServer(analysis);
				document.location =  constants.apiPaths.ccaAnalysis(this.estimationAnalysis().id());
				this.loading(false);
			});
		}

		prepForSave() {
			var specification = ko.toJS(this.estimationAnalysis());
			specification.cohortDefinitions = [];
			specification.conceptSets = [];
			specification.conceptSetCrossReference = [];
			specification.estimationAnalysisSettings.analysisSpecification.targetComparatorOutcomes = [];
			specification.packageName = this.packageName();

			this.comparisons().forEach((comp, index) => {
				var tco = new TargetComparatorOutcomes({
					targetId: comp.target().id,
					comparatorId: comp.comparator().id,
					outcomeIds: comp.outcomes().map(d => {return d.id}),
				});
				specification.estimationAnalysisSettings.analysisSpecification.targetComparatorOutcomes.push(tco);
				this.addCohortToEstimation(specification, comp.target);
				this.addCohortToEstimation(specification, comp.comparator);
				comp.outcomes().map(o => this.addCohortToEstimation(specification, o));

				if (comp.negativeControlOutcomesConceptSet() !== null && comp.negativeControlOutcomesConceptSet().id > 0) {
					this.addConceptSetToEstimation(specification, ko.toJS(comp.negativeControlOutcomesConceptSet), 
						constants.conceptSetCrossReference.negativeControlOutcomes.targetName, 
						index, 
						constants.conceptSetCrossReference.negativeControlOutcomes.propertyName);
				}
				if (comp.includedCovariateConceptSet() !== null && comp.includedCovariateConceptSet().id > 0) {
					this.addConceptSetToEstimation(specification, ko.toJS(comp.includedCovariateConceptSet), 
						constants.conceptSetCrossReference.targetComparatorOutcome.targetName,
						index, 
						constants.conceptSetCrossReference.targetComparatorOutcome.propertyName.includedCovariateConcepts);
				}
				if (comp.excludedCovariateConceptSet() !== null && comp.excludedCovariateConceptSet().id > 0) {
					this.addConceptSetToEstimation(specification, ko.toJS(comp.excludedCovariateConceptSet), 
						constants.conceptSetCrossReference.targetComparatorOutcome.targetName,
						index, 
						constants.conceptSetCrossReference.targetComparatorOutcome.propertyName.excludedCovariateConcepts);
				}
			});
			specification.estimationAnalysisSettings.analysisSpecification.cohortMethodAnalysisList.forEach((a, index) => {
				// Set the analysisId on each analysis
				a.analysisId = index + 1;

				var covarSettings = a.getDbCohortMethodDataArgs.covariateSettings;
				if (covarSettings.includedCovariateConceptSet !== null && covarSettings.includedCovariateConceptSet.id > 0) {
					this.addConceptSetToEstimation(specification, covarSettings.includedCovariateConceptSet, 
						constants.conceptSetCrossReference.analysisCovariateSettings.targetName, 
						index, 
						constants.conceptSetCrossReference.analysisCovariateSettings.propertyName.includedCovariateConcepts);
				}
				if (covarSettings.excludedCovariateConceptSet !== null && covarSettings.excludedCovariateConceptSet.id > 0) {
					this.addConceptSetToEstimation(specification, covarSettings.excludedCovariateConceptSet, 
						constants.conceptSetCrossReference.analysisCovariateSettings.targetName,
						index, 
						constants.conceptSetCrossReference.analysisCovariateSettings.propertyName.excludedCovariateConcepts);
				}

				// Remove the concept set references by setting it to the base class
				specification.estimationAnalysisSettings.analysisSpecification.cohortMethodAnalysisList[index].getDbCohortMethodDataArgs.covariateSettings = ko.toJS(new CovariateSettings(covarSettings));
			});
			var pcsaCovarSettings = specification.positiveControlSynthesisArgs.covariateSettings;
			if (pcsaCovarSettings != null) {				
				if (pcsaCovarSettings.includedCovariateConceptSet !== null && pcsaCovarSettings.includedCovariateConceptSet.id > 0) {
					this.addConceptSetToEstimation(specification, pcsaCovarSettings.includedCovariateConceptSet, 
						constants.conceptSetCrossReference.positiveControlCovariateSettings.targetName, 
						index, 
						constants.conceptSetCrossReference.positiveControlCovariateSettings.targetName.includedCovariateConcepts);
				}
				if (pcsaCovarSettings.excludedCovariateConceptSet !== null && pcsaCovarSettings.excludedCovariateConceptSet.id > 0) {
					this.addConceptSetToEstimation(specification, pcsaCovarSettings.excludedCovariateConceptSet, 
						constants.conceptSetCrossReference.positiveControlCovariateSettings.targetName, 
						index, 
						constants.conceptSetCrossReference.positiveControlCovariateSettings.targetName.includedCovariateConcepts);
				}

				// Remove the concept set references by setting it to the base class
				pcsaCovarSettings = ko.toJS(new CovariateSettings(pcsaCovarSettings));
			}

			return {
				id: this.estimationAnalysis().id(),
				name: this.estimationAnalysis().name(),
				type: this.estimationType,
				description: this.estimationAnalysis().description(),
				specification: ko.toJSON(specification),
			};
		}

		close() {
			if (this.dirtyFlag().isDirty() && !confirm("Estimation Analysis changes are not saved. Would you like to continue?")) {
				return;
			}
			this.loading(true);
			this.estimationAnalysis(null);
			this.selectedAnalysisId(null);
			this.comparisons.removeAll();
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.estimationAnalysis()));
			document.location = constants.apiPaths.browser();
		}

		copy() {
			this.loading(true);
			EstimationService.copyEstimation(this.selectedAnalysisId()).then((analysis) => {
				this.loadAnalysisFromServer(analysis);
				this.loading(false);
				document.location = constants.apiPaths.ccaAnalysis(this.estimationAnalysis().id());
			});	
		}

		addAnalysis() {
			this.cohortMethodAnalysisList.push(
				new CohortMethodAnalysis({description: "New analysis " + (this.cohortMethodAnalysisList().length + 1)}, this.defaultCovariateSettings)
			);
			// Get the index
			var index = this.cohortMethodAnalysisList().length - 1;
			this.editAnalysis(this.cohortMethodAnalysisList()[index]);
		}

		editAnalysis(analysis) {
			this.editorHeading('Analysis Settings');
			this.editorDescription('Add or update the analysis settings');
			this.editorComponentName('cohort-method-analysis-editor');
			this.editorComponentParams({ 
				analysis: analysis,
			});
			this.managerMode('editor')
		}

		copyAnalysisSettings(obj, index) {
			var newAnalysis = ko.toJS(this.cohortMethodAnalysisList()[index]);
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
			this.editorHeading('Comparison');
			this.editorDescription('Add or update the target, comparator, outcome(s) cohorts and negative control outcomes');
			this.editorComponentName('comparison-editor');
			this.editorComponentParams({ 
				comparison: comparison,
			});
			this.managerMode('editor')
		}

		copyComparison(obj, index) {
			var newComparison = ko.toJS(this.comparisons()[index]);
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

		newAnalysis() {
			this.loading(true);
			this.estimationAnalysis(new EstimationAnalysis({id: 0, name: 'New Population Level Estimation Analysis'}, this.estimationType, this.defaultCovariateSettings));
			// EstimationAnalysis takes time to load - use the setTimeout({}, 0) 
			// to allow the event loop to catch up.
			// http://stackoverflow.com/questions/779379/why-is-settimeoutfn-0-sometimes-useful
			setTimeout(() => {
				this.setCohortMethodAnalysisList();
				this.resetDirtyFlag();
				this.loading(false);
			}, 0);
		}

		onAnalysisSelected() {
			this.loading(true);
			EstimationService.getEstimation(this.selectedAnalysisId()).then((analysis) => {
				this.loadAnalysisFromServer(analysis);
				this.loading(false);
			});
		};

		loadAnalysisFromServer(analysis) {
			var header = analysis.json;
			var specification = JSON.parse(analysis.data.specification);
			this.estimationAnalysis(new EstimationAnalysis(specification, this.estimationType, this.defaultCovariateSettings));
			this.estimationAnalysis().id(header.id);
			this.estimationAnalysis().name(header.name);
			this.estimationAnalysis().description(header.description);
			this.packageName(header.packageName);
			this.setCohortMethodAnalysisList();
			this.setUserInterfaceDependencies();
			this.fullSpecification(null);
			this.resetDirtyFlag();
		}

		resetDirtyFlag() {
			this.dirtyFlag(new ohdsiUtil.dirtyFlag({analysis: this.estimationAnalysis(), comparisons: this.comparisons}));				
		}

		setCohortMethodAnalysisList() {
			this.cohortMethodAnalysisList = this.estimationAnalysis().estimationAnalysisSettings.analysisSpecification.cohortMethodAnalysisList;
		}

		setUserInterfaceDependencies() {
			this.comparisons.removeAll();
			var cohortDefinitions = this.estimationAnalysis().cohortDefinitions();
			var conceptSets = this.estimationAnalysis().conceptSets();
			var csXref =this.estimationAnalysis().conceptSetCrossReference();
			this.estimationAnalysis().estimationAnalysisSettings.analysisSpecification.targetComparatorOutcomes().forEach((tco, index) => {
				var target = null;
				var comparator = null;
				var outcomes = [];
		
				if (tco.targetId() !== null) {
					var tCohortDefinitionList = cohortDefinitions.filter((d) => { return d.id() === tco.targetId()});
					if (tCohortDefinitionList.length > 0) {
						target = {id: tco.targetId(), name: tCohortDefinitionList[0].name()};
					} else {
						console.error("Target cohort id: " + tco.comparatorId() + " not found in cohort definition collection");
					}
				}
				if (tco.comparatorId() !== null) {
					var cCohortDefinitionList = cohortDefinitions.filter((d) => { return d.id() === tco.comparatorId()});
					if (cCohortDefinitionList.length > 0) {
						comparator = {id: tco.comparatorId(), name: cCohortDefinitionList[0].name()};
					} else {
						console.error("Comparator cohort id: " + tco.comparatorId() + " not found in cohort definition collection");
					}
				}
				tco.outcomeIds().forEach(outcomeId => {
					var oCohortDefinitionList = cohortDefinitions.filter((d) => { return d.id() === outcomeId});
					if (oCohortDefinitionList.length > 0) {
						outcomes.push({id: outcomeId, name: oCohortDefinitionList[0].name()});
					} else {
						console.error("Outcome cohort id: " + outcomeId + " not found in cohort definition collection");
					}
				});

				var comp = new Comparison({
					target: target, 
					comparator: comparator,
					outcomes: outcomes,
				});
				this.comparisons.push(comp);
			});
			csXref.forEach((xref) => {
				// Find the concept set each item
				var selectedConceptSetList = conceptSets.filter((cs) => { return cs.id === xref.conceptSetId});
				if (selectedConceptSetList.length == 0) {
					console.error("Concept Set: " + xref.conceptSetId + " not found in specification.");
				}
				var selectedConceptSet = new ConceptSet({id: selectedConceptSetList[0].id, name: selectedConceptSetList[0].name()});
				if (xref.targetName === constants.conceptSetCrossReference.targetComparatorOutcome.targetName) {
					if (xref.propertyName === constants.conceptSetCrossReference.targetComparatorOutcome.propertyName.includedCovariateConcepts) {
						this.comparisons()[xref.targetIndex].includedCovariateConceptSet(selectedConceptSet);
					}
					if (xref.propertyName === constants.conceptSetCrossReference.targetComparatorOutcome.propertyName.excludedCovariateConcepts) {
						this.comparisons()[xref.targetIndex].excludedCovariateConceptSet(selectedConceptSet);
					}
				} else if (xref.targetName === constants.conceptSetCrossReference.negativeControlOutcomes.targetName) {
					this.comparisons()[xref.targetIndex].negativeControlOutcomesConceptSet(selectedConceptSet);
				} else if (xref.targetName == constants.conceptSetCrossReference.analysisCovariateSettings.targetName) {
					var targetAnalysis = this.estimationAnalysis().estimationAnalysisSettings.analysisSpecification.cohortMethodAnalysisList()[xref.targetIndex];
					if (xref.propertyName === constants.conceptSetCrossReference.analysisCovariateSettings.propertyName.includedCovariateConcepts) {
						targetAnalysis.getDbCohortMethodDataArgs.covariateSettings.includedCovariateConceptSet(selectedConceptSet);
					}
					if (xref.propertyName === constants.conceptSetCrossReference.analysisCovariateSettings.propertyName.excludedCovariateConcepts) {
						targetAnalysis.getDbCohortMethodDataArgs.covariateSettings.excludedCovariateConceptSet(selectedConceptSet);
					}
				} else if (xref.targetName == constants.conceptSetCrossReference.positiveControlCovariateSettings.targetName) {
					var targetPcsCovariateSettings = this.estimationAnalysis().positiveControlSynthesisArgs().covariateSettings;
					if (xref.propertyName === constants.conceptSetCrossReference.positiveControlCovariateSettings.propertyName.includedCovariateConcepts) {
						targetPcsCovariateSettings.includedCovariateConceptSet(selectedConceptSet);
					}
					if (xref.propertyName === constants.conceptSetCrossReference.positiveControlCovariateSettings.propertyName.excludedCovariateConcepts) {
						targetPcsCovariateSettings.excludedCovariateConceptSet(selectedConceptSet);
					}
				}
			});
		}
		
		init() {
			FeatureExtractionService.getDefaultCovariateSettings().then(({ data }) => {
				this.defaultCovariateSettings = data;
				if (this.selectedAnalysisId() == 0 && !this.dirtyFlag().isDirty()) {
					this.newAnalysis();
				} else if (this.selectedAnalysisId() > 0 && this.selectedAnalysisId() != (this.estimationAnalysis() && this.estimationAnalysis().id())) {
					this.onAnalysisSelected();
				} else {
					this.setCohortMethodAnalysisList();
					this.loading(false);
				}
			});
		}

		addCohortToEstimation(specification, cohort) {
			cohort = ko.isObservable(cohort) ? ko.utils.unwrapObservable(cohort) : cohort;
			if (specification.cohortDefinitions.filter(element => element.id === cohort.id).length == 0) {
				specification.cohortDefinitions.push(cohort);
			}
		}

		addConceptSetToEstimation(specification, conceptSet, targetName, targetIndex, propertyName) {
			if (specification.conceptSets.filter(element => element.id === conceptSet.id).length == 0) {
				specification.conceptSets.push(conceptSet);
			}
			specification.conceptSetCrossReference.push(
				new ConceptSetCrossReference({
					conceptSetId: conceptSet.id,
					targetName: targetName,
					targetIndex: targetIndex,
					propertyName: propertyName
				})
			);				
		}

		closeEditor() {
			this.managerMode('summary');
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
			var payload = this.prepForSave();

			EstimationService.saveEstimation(payload)
				.then((analysis) => {
					this.resetDirtyFlag();
					this.loadingMessage(this.defaultLoadingMessage);
					return fileService.loadZip(
						config.api.url + constants.apiPaths.downloadCcaAnalysisPackage(this.selectedAnalysisId()),
						`estimation_study_${this.selectedAnalysisId()}_export.zip`
					);
				})
				.catch((e) => console.error("error when exporting: " + e))
				.finally(() => this.loading(false));
		}

		exportFullSpecification() {
			this.isExporting(true);
			EstimationService.exportFullSpecification(this.selectedAnalysisId()).then((analysis) => {
				this.fullSpecification(commonUtils.syntaxHighlight(ko.toJSON(analysis.data)));
				this.isExporting(false);
			}).catch((e) => {
				console.error("error when exporting: " + e)
				this.isExporting(false);
			});
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

	return commonUtils.build('cca-manager', ComparativeCohortAnalysisManager, view);;
});