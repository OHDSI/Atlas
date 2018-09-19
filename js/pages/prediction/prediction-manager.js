define([
	'knockout', 
	'text!./prediction-manager.html',	
	'providers/Component',
	'utils/CommonUtils',
    'appConfig',
	'./options',
	'./inputTypes/Cohort',
	'./inputTypes/PatientLevelPredictionAnalysis',
	'./inputTypes/ModelSettings',
	'./inputTypes/CreateStudyPopulationArgs',
	'featureextraction/InputTypes/CovariateSettings',
	'featureextraction/InputTypes/TemporalCovariateSettings',
	'./inputTypes/TargetOutcome',
	'./inputTypes/ModelCovarPopTuple',
	'./inputTypes/FullAnalysis',
	'./inputTypes/ConceptSetCrossReference',
	'services/FeatureExtraction',
	'featureextraction/components/CovariateSettingsEditor',
	'featureextraction/components/TemporalCovariateSettingsEditor',
	'components/cohort-definition-browser',
	'faceted-datatable',
	'less!./prediction-manager.less',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
    config,
	options,
	Cohort,
	PatientLevelPredictionAnalysis,
	modelSettings,
	CreateStudyPopulationArgs,
	CovariateSettings,
	TemporalCovariateSettings,
	TargetOutcome,
	ModelCovarPopTuple,
	FullAnalysis,
	ConceptSetCrossReference,
	FeatureExtractionService,
) {
	class PatientLevelPredictionManager extends Component {
		constructor(params) {
            super(params);

			this.patientLevelPredictionAnalysis = new PatientLevelPredictionAnalysis();
			this.options = options;
            this.config = config;
			this.editorComponentName = ko.observable(null);
			this.editorComponentParams = ko.observable({});
			this.editorDescription = ko.observable();
			this.editorHeading = ko.observable();
			this.loading = ko.observable(true);
			this.loadingDownload = ko.observable(false);
			this.managerMode = ko.observable('summary');
			this.modelSettings = modelSettings;
			this.specificationPillMode = ko.observable('all');
			this.tabMode = ko.observable('specification');
			this.downloadTabMode = ko.observable('full');
			this.utilityPillMode = ko.observable('download');
			this.targetCohorts = ko.observableArray();
			this.outcomeCohorts = ko.observableArray();
			this.currentCohortList = null;
			this.targetOutcomePairs = ko.observableArray();
			this.modelCovarPopTuple = ko.observableArray();
			this.fullAnalysisList = ko.observableArray();
			this.showCohortSelector = ko.observable(false);
			this.defaultCovariateSettings = null;
			this.defaultTemporalCovariateSettings = null;


			this.removeTargetCohort = (data, obj, tableRow, rowIndex) => {
				this.deleteFromTable(this.targetCohorts, obj, rowIndex);
			}

			this.removeOutcomeCohort = (data, obj, tableRow, rowIndex) => {
				this.deleteFromTable(this.outcomeCohorts, obj, rowIndex);
			}

			this.removeModelSetting = (data, obj, tableRow, rowIndex) => {
				this.deleteFromTable(this.patientLevelPredictionAnalysis.modelSettings, obj, rowIndex);
			}

			this.removeCovariateSetting = (data, obj, tableRow, rowIndex) => {
				this.deleteFromTable(this.patientLevelPredictionAnalysis.covariateSettings, obj, rowIndex);
			}

			this.removePopulationSetting = (data, obj, tableRow, rowIndex) => {
				this.deleteFromTable(this.patientLevelPredictionAnalysis.populationSettings, obj, rowIndex);
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

			this.addTarget = () => {
				this.currentCohortList = this.targetCohorts;
				this.showCohortSelector(true);
			}

			this.addOutcome = () => {
				this.currentCohortList = this.outcomeCohorts;
				this.showCohortSelector(true);
			}

			this.cohortSelected = (id, name) => {
				console.log(id + ": " + name);
				if (this.currentCohortList().filter(a => a.id === parseInt(id)).length == 0) {
					this.currentCohortList.push(new Cohort({id: id, name: name}));
				}
				this.showCohortSelector(false);
			}

					
			this.patientLevelPredictionAnalysisJson = () => {
				return commonUtils.syntaxHighlight(ko.toJSON(this.patientLevelPredictionAnalysis));
			}
			
			this.patientLevelPredictionAnalysisForWebAPI = () => {
				var definition = ko.toJS(this.patientLevelPredictionAnalysis);
				definition = ko.toJSON(definition);
				return JSON.stringify(definition);
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

			this.prepForSave = () => {
				console.log('prep for save');
				var outcomeIds = [];
				this.outcomeCohorts().forEach(o => { outcomeIds.push(o.id) });
				this.patientLevelPredictionAnalysis.targetIds.removeAll();
				this.patientLevelPredictionAnalysis.outcomeIds.removeAll();
				this.patientLevelPredictionAnalysis.cohortDefinitions.removeAll();
				this.patientLevelPredictionAnalysis.conceptSets.removeAll();
				this.patientLevelPredictionAnalysis.conceptSetCrossReference.removeAll();
				this.outcomeCohorts().forEach(o => {
					this.patientLevelPredictionAnalysis.outcomeIds.push(o.id);
					this.patientLevelPredictionAnalysis.cohortDefinitions.push(o);
				});
				this.targetCohorts().forEach(t => {
					this.patientLevelPredictionAnalysis.targetIds.push(t.id);
					this.patientLevelPredictionAnalysis.cohortDefinitions.push(t);
				});
				this.patientLevelPredictionAnalysis.covariateSettings().forEach((cs, index) => {
					if (cs.includedCovariateConceptSet() !== null && cs.includedCovariateConceptSet().id > 0) {
						if (this.patientLevelPredictionAnalysis.conceptSets().filter(element => element.id === cs.includedCovariateConceptSet().id).length == 0) {
							this.patientLevelPredictionAnalysis.conceptSets.push(cs.includedCovariateConceptSet());
						}
						this.patientLevelPredictionAnalysis.conceptSetCrossReference.push(
							new ConceptSetCrossReference({
								conceptSetId: cs.includedCovariateConceptSet().id,
								targetName: "covariateSettings",
								targetIndex: index,
								propertyName: "includedCovariateConceptIds"
							})
						);

					}
					if (cs.excludedCovariateConceptSet() !== null && cs.excludedCovariateConceptSet().id > 0) {
						if (this.patientLevelPredictionAnalysis.conceptSets().filter(element => element.id === cs.excludedCovariateConceptSet().id).length == 0) {
							this.patientLevelPredictionAnalysis.conceptSets.push(cs.excludedCovariateConceptSet());
						}
						this.patientLevelPredictionAnalysis.conceptSetCrossReference.push(
							new ConceptSetCrossReference({
								conceptSetId: cs.excludedCovariateConceptSet().id,
								targetName: "covariateSettings",
								targetIndex: index,
								propertyName: "excludedCovariateConceptIds"
							})
						);
					}
				});
				console.log('how we lookin?');
			}

			this.addModelSettings = (d) => {
				this.patientLevelPredictionAnalysis.modelSettings.push(d.action());
				var index = this.patientLevelPredictionAnalysis.modelSettings().length - 1;
				this.editorHeading(d.name + ' Model Settings');
				this.editorDescription('Use the options below to edit the model settings');
				this.editorComponentName('model-settings-editor');
				this.editorComponentParams({ 
					modelSettings: this.patientLevelPredictionAnalysis.modelSettings()[index], 
				});
				this.managerMode('editor');
			}

			this.addPopulationSettings = () => {
				this.patientLevelPredictionAnalysis.populationSettings.push(
					new CreateStudyPopulationArgs()
				);
				var index = this.patientLevelPredictionAnalysis.populationSettings().length - 1;
				this.editorHeading('Population Settings');
				this.editorDescription('Add or update the population settings');
				this.editorComponentName('population-settings-editor');
				this.editorComponentParams({ 
					populationSettings: this.patientLevelPredictionAnalysis.populationSettings()[index], 
				});
				this.managerMode('editor');
			}

			this.addCovariateSettings = (setting) => {
				const covariateSettings = (setting == 'Temporal') ? new TemporalCovariateSettings(this.defaultTemporalCovariateSettings) : new CovariateSettings(this.defaultCovariateSettings);
				const headingPrefix = (setting == 'Temporal') ? 'Temporal ' : '';
				const editorNamePrefix = (setting == 'Temporal') ? 'temporal-' : '';
				this.patientLevelPredictionAnalysis.covariateSettings.push(
					covariateSettings
				);
				var index = this.patientLevelPredictionAnalysis.covariateSettings().length - 1;
				this.editorHeading(headingPrefix + 'Covariate Settings');
				this.editorDescription('Add or update the covariate settings');
				this.editorComponentName(editorNamePrefix + 'prediction-covar-settings-editor');
				this.editorComponentParams({ 
					covariateSettings: this.patientLevelPredictionAnalysis.covariateSettings()[index], 
				});
				this.managerMode('editor');
			}

			this.closeEditor = () => {
				this.managerMode('summary');
			}
			
			this.load = () => {
				FeatureExtractionService.getDefaultCovariateSettings().then(({ data }) => {
					this.defaultCovariateSettings = data;
				});
				FeatureExtractionService.getDefaultCovariateSettings(true).then(({ data }) => {
					this.defaultTemporalCovariateSettings = data;
				});

				this.patientLevelPredictionAnalysis.targetIds().forEach(c => {
					var name = "NOT FOUND";
					if (this.patientLevelPredictionAnalysis.cohortDefinitions().filter(a => a.id() === parseInt(c)).length > 0) {
						name = this.patientLevelPredictionAnalysis.cohortDefinitions().filter(a => a.id() === parseInt(c))[0].name();
						this.targetCohorts.push(new Cohort({id: c, name: name}));
					}
				});
	
				this.patientLevelPredictionAnalysis.outcomeIds().forEach(c => {
					var name = "NOT FOUND";
					if (this.patientLevelPredictionAnalysis.cohortDefinitions().filter(a => a.id() === parseInt(c)).length > 0) {
						name = this.patientLevelPredictionAnalysis.cohortDefinitions().filter(a => a.id() === parseInt(c))[0].name();
						this.outcomeCohorts.push(new Cohort({id: c, name: name}));
					}
				});

				// Set Up Dummy PLP Settings
				/*
				this.patientLevelPredictionAnalysis.cohortDefinitions.push([
					{id: 1, name: 'Type 2 Diabetes'},
					{id: 2, name: 'Type 2 Diabetes With Prior Stroke'},
					//{id: 3, name: 'Target 3'},
					{id: 4, name: 'Heart Failure'},
					{id: 5, name: 'Stroke'},
					//{id: 6, name: 'Outcome 3'},
					//{id: 7, name: 'Outcome 4'},
				]);

				this.targetCohorts.push(
					new Cohort({id: 1, name: 'Type 2 Diabetes'})
				);
				this.targetCohorts.push(
					new Cohort({id: 2, name: 'Type 2 Diabetes With Prior Stroke'})
				);

				this.outcomeCohorts.push(
					new Cohort({id: 4, name: 'Heart Failure'})
				)
				this.outcomeCohorts.push(
					new Cohort({id: 5, name: 'Stroke 1'})
				);
				this.outcomeCohorts.push(
					new Cohort({id: 6, name: 'Stroke 2'})
				);
				this.outcomeCohorts.push(
					new Cohort({id: 7, name: 'Stroke 3'})
				);

				this.patientLevelPredictionAnalysis.targetOutcomes.push(
					new TargetOutcomes({targetId: 1, outcomeIds: [4,5]})
				);
				this.patientLevelPredictionAnalysis.targetOutcomes.push(
					new TargetOutcomes({targetId: 2, outcomeIds: [4,5]})
				);
				//this.patientLevelPredictionAnalysis.targetOutcomes.push(
				//	new TargetOutcomes({targetId: 3, outcomeIds: [6,7]}),
				//);
				this.patientLevelPredictionAnalysis.modelSettings.push({
					NaiveBayes: new modelSettings.NaiveBayes(null)
				});
				this.patientLevelPredictionAnalysis.modelSettings.push({
					RandomForest: new modelSettings.RandomForest(null)
				});
				/*
				this.patientLevelPredictionAnalysis.modelSettings.push({
					MultilayerPerceptionModel: new modelSettings.MultilayerPerceptionModel(null)
				});
				this.patientLevelPredictionAnalysis.modelSettings.push({
					KNearestNeighbors: new modelSettings.KNearestNeighbors(null)
				});
				this.patientLevelPredictionAnalysis.modelSettings.push({
					GradientBoostingMachine: new modelSettings.GradientBoostingMachine(null)
				});
				this.patientLevelPredictionAnalysis.modelSettings.push({
					DecisionTree: new modelSettings.DecisionTree(null)
				});
				this.patientLevelPredictionAnalysis.modelSettings.push({
					AdaBoost: new modelSettings.AdaBoost(null)
				});
				this.patientLevelPredictionAnalysis.modelSettings.push({
					LassoLogisticRegression: new modelSettings.LassoLogisticRegression(null)
				});
				this.patientLevelPredictionAnalysis.covariateSettings.push(
					new	CovariateSettings({useDemographicsRace: 1})
				);
				this.patientLevelPredictionAnalysis.covariateSettings.push(
					new	CovariateSettings({useDemographicsRace: 0})
				);
				this.patientLevelPredictionAnalysis.populationSettings.push(
					new CreateStudyPopulationArgs({riskWindowStart: 1, riskWindowEnd: 90, washoutPeriod: 180, removeSubjectsWithPriorOutcome: true})
				);
				this.patientLevelPredictionAnalysis.populationSettings.push(
					new CreateStudyPopulationArgs({riskWindowStart: 1, riskWindowEnd: 365, washoutPeriod: 180, removeSubjectsWithPriorOutcome: true})
				);
				*/

				this.loading(false);
			}

			this.computeCartesian = () => {
				// Init
				this.loadingDownload(true);
				this.targetOutcomePairs.removeAll();
				this.modelCovarPopTuple.removeAll();
				this.fullAnalysisList.removeAll();

				// T*O Pairs
				var targetOutcomeCartesian = commonUtils.cartesian(this.targetCohorts(), this.outcomeCohorts());
				targetOutcomeCartesian.forEach(element => {
					if (element.length != 2) {
						console.error("Expecting array with index 0: treatments, 1: outcomes");
					} else {
						this.targetOutcomePairs().push(
							new TargetOutcome({
								targetId: element[0].id,
								targetName: element[0].name,
								outcomeId: element[1].id,
								outcomeName: element[1].name,
							})
						);
					}
				});
				this.targetOutcomePairs.valueHasMutated();

				// Analysis Settings
				var modelCovarPopCartesian = commonUtils.cartesian(
					this.patientLevelPredictionAnalysis.modelSettings(),
					this.patientLevelPredictionAnalysis.covariateSettings(),
					this.patientLevelPredictionAnalysis.populationSettings(),
				);
				//console.log(modelCovarPopCartesian);
				modelCovarPopCartesian.forEach(element => {
					if (element.length != 3) {
						console.error("Expecting array with index 0: model, 1: covariate settings, 2: population settings");
					} else {
						this.modelCovarPopTuple().push(
							new ModelCovarPopTuple({
								modelName: Object.keys(element[0])[0],
								modelSettings: ko.toJSON(element[0][Object.keys(element[0])[0]]),
								covariateSettings: ko.toJSON(element[1]),
								popRiskWindowStart: element[2].riskWindowStart(),
								popRiskWindowEnd: element[2].riskWindowEnd(),
							})
						);
					}
				});
				//console.log(this.modelCovarPopTuple());
				this.modelCovarPopTuple.valueHasMutated();

				// Full Analysis
				var fullAnalysisCartesian = commonUtils.cartesian(
					this.targetOutcomePairs(),
					this.modelCovarPopTuple(),
				);
				//console.log(fullAnalysisCartesian);
				this.fullAnalysisList.removeAll();
				fullAnalysisCartesian.forEach(element => {
					if (element.length != 2) {
						console.error("Expecting array with index 0: TargetOutcome, 1: ModelCovarPopTuple");
					} else {
						this.fullAnalysisList().push(
							new FullAnalysis(element[0],element[1])
						);
					}
				});
				//console.log(this.fullAnalysisList());
				this.fullAnalysisList.valueHasMutated();
				this.loadingDownload(false);
			}

            this.load();
		}
	}

	return commonUtils.build('prediction-manager', PatientLevelPredictionManager, view);
});