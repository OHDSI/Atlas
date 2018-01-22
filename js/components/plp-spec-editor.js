define(['jquery', 'knockout', 'text!./plp-spec-editor.html', 'clipboard',
				'webapi/CohortDefinitionAPI', 'appConfig', 'ohdsi.util',
				'plp/PatientLevelPredictionAnalysis', 'plp/options',
				'cohortbuilder/CohortDefinition', 'vocabularyprovider',
				'conceptsetbuilder/InputTypes/ConceptSet'],
	function ($, ko, view, clipboard, cohortDefinitionAPI, config, ohdsiUtil,
		PatientLevelPredictionAnalysis, options, CohortDefinition, vocabularyAPI,
		ConceptSet) {
		function plpSpecEditor(params) {
			var self = this;
			self.patientLevelPrediction = params.patientLevelPrediction;
			self.patientLevelPredictionDirtyFlag = params.dirtyFlag;
			self.options = options;

			self.cohortSelected = function (id) {
				$('#modalCohortDefinition').modal('hide');
				cohortDefinitionAPI.getCohortDefinition(id).then(function (cohortDefinition) {
					self.targetId(cohortDefinition.id);
					self.targetCaption(cohortDefinition.name);
					cohortDefinition.expression = JSON.parse(cohortDefinition.expression);
					self.targetCohortDefinition(new CohortDefinition(cohortDefinition));
				});
			}

			self.conceptsetSelected = function (d) {
				$('#modalConceptSet').modal('hide');
				vocabularyAPI.getConceptSetExpression(d.id).then(function (csExpression) {
					self.targetId(d.id);
					self.targetCaption(d.name);
					var conceptSetData = new ConceptSet({
						id: d.id,
						name: d.name,
						expression: csExpression
					});
					self.targetExpression.removeAll();
					self.targetExpression.push(conceptSetData);

					vocabularyAPI.getConceptSetExpressionSQL(csExpression).then(
						function (data) {
							self.targetConceptSetSQL(data);
						});
				});
			}

			self.chooseTreatment = function () {
				$('#modalCohortDefinition').modal('show');
				self.targetId = self.patientLevelPrediction().treatmentId;
				self.targetCaption = self.patientLevelPrediction().treatmentCaption;
				self.targetCohortDefinition = self.patientLevelPrediction().treatmentCohortDefinition;
			}

			self.chooseOutcome = function () {
				$('#modalCohortDefinition').modal('show');
				self.targetId = self.patientLevelPrediction().outcomeId;
				self.targetCaption = self.patientLevelPrediction().outcomeCaption;
				self.targetCohortDefinition = self.patientLevelPrediction().outcomeCohortDefinition;
			}

			self.choosePsExclusion = function () {
				$('#modalConceptSet').modal('show');
				self.targetId = self.patientLevelPrediction().cvExclusionId;
				self.targetCaption = self.patientLevelPrediction().cvExclusionCaption;
				self.targetExpression = self.patientLevelPrediction().cvExclusionConceptSet;
				self.targetConceptSetSQL = self.patientLevelPrediction().cvExclusionConceptSetSQL;
			}

			self.choosePsInclusion = function () {
				$('#modalConceptSet').modal('show');
				self.targetId = self.patientLevelPrediction().cvInclusionId;
				self.targetCaption = self.patientLevelPrediction().cvInclusionCaption;
				self.targetExpression = self.patientLevelPrediction().cvInclusionConceptSet;
				self.targetConceptSetSQL = self.patientLevelPrediction().cvInclusionConceptSetSQL;
			}

			self.clearPsExclusion = function () {
				self.patientLevelPrediction().cvExclusionId(0);
				self.patientLevelPrediction().cvExclusionCaption(null);
				self.patientLevelPrediction().cvExclusionConceptSet.removeAll();
				self.patientLevelPrediction().cvExclusionConceptSetSQL(null);
			}

			self.clearPsInclusion = function () {
				self.patientLevelPrediction().cvInclusionId(0);
				self.patientLevelPrediction().cvInclusionCaption(null);
				self.patientLevelPrediction().cvInclusionConceptSet.removeAll();
				self.patientLevelPrediction().cvInclusionConceptSetSQL(null);
			}

			self.clearTreatment = function () {
				self.patientLevelPrediction().treatmentId(0);
				self.patientLevelPrediction().treatmentCaption(null);
				self.patientLevelPrediction().treatmentCohortDefinition(null);
			}

			self.clearOutcome = function () {
				self.patientLevelPrediction().outcomeId(0);
				self.patientLevelPrediction().outcomeCaption(null);
				self.patientLevelPrediction().outcomeCohortDefinition(null);
			}

			self.modelSettingExists = function (settingName) {
				settingList = self.patientLevelPrediction().modelTypeSettings().filter(function (item) {
					return item.setting == settingName;
				});
				return (settingList.length > 0);
			}

			self.modelSettingDescription = function (settingName) {
				settingList = self.patientLevelPrediction().modelTypeSettings().filter(function (item) {
					return item.setting == settingName;
				});
				if (settingList.length > 0) {
					return settingList[0].description + " (default = " + settingList[0].defaultValue + "):";
				} else {
					return "SETTING NOT FOUND!!";
				}
			}

			self.resetToDefault = function (settingName) {
				var currentSetting = self.patientLevelPrediction().getCurrentModelSettingsByName(settingName);
				if (currentSetting && currentSetting.length > 0) {
					currentSetting[0].reference(currentSetting[0].defaultValue);
				}
			}
		}

		var component = {
			viewModel: plpSpecEditor,
			template: view
		};

		ko.components.register('plp-spec-editor', component);
		return component;

	});
