define(['jquery', 'knockout', 'text!./plp-spec-editor.html', 'clipboard',
				'services/CohortDefinition', 'appConfig', 'assets/ohdsi.util',
				'plp/PatientLevelPredictionAnalysis', 'plp/options',
				'components/cohortbuilder/CohortExpression', 'providers/Vocabulary',
				'conceptsetbuilder/InputTypes/ConceptSet'],
	function ($, ko, view, clipboard, cohortDefinitionService, config, ohdsiUtil,
		PatientLevelPredictionAnalysis, options, CohortExpression, vocabularyAPI,
		ConceptSet) {
		function plpSpecEditor(params) {
			var self = this;
			self.currentPlpAnalysis = params.currentPlpAnalysis;
			self.patientLevelPredictionDirtyFlag = params.dirtyFlag;
			self.options = options;

			self.cohortSelected = function (id) {
				$('#modalCohortDefinition').modal('hide');
				cohortDefinitionService.getCohortDefinition(id).then(function (cohortDefinition) {
					self.targetId(cohortDefinition.id);
					self.targetCaption(cohortDefinition.name);
					cohortDefinition.expression = JSON.parse(cohortDefinition.expression);
					self.targetCohortDefinition(new CohortExpression(cohortDefinition));
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
						function ({ data }) {
							self.targetConceptSetSQL(data);
						});
				});
			}

			self.chooseTreatment = function () {
				$('#modalCohortDefinition').modal('show');
				self.targetId = self.currentPlpAnalysis().treatmentId;
				self.targetCaption = self.currentPlpAnalysis().treatmentCaption;
				self.targetCohortDefinition = self.currentPlpAnalysis().treatmentCohortDefinition;
			}

			self.chooseOutcome = function () {
				$('#modalCohortDefinition').modal('show');
				self.targetId = self.currentPlpAnalysis().outcomeId;
				self.targetCaption = self.currentPlpAnalysis().outcomeCaption;
				self.targetCohortDefinition = self.currentPlpAnalysis().outcomeCohortDefinition;
			}

			self.choosePsExclusion = function () {
				$('#modalConceptSet').modal('show');
				self.targetId = self.currentPlpAnalysis().cvExclusionId;
				self.targetCaption = self.currentPlpAnalysis().cvExclusionCaption;
				self.targetExpression = self.currentPlpAnalysis().cvExclusionConceptSet;
				self.targetConceptSetSQL = self.currentPlpAnalysis().cvExclusionConceptSetSQL;
			}

			self.choosePsInclusion = function () {
				$('#modalConceptSet').modal('show');
				self.targetId = self.currentPlpAnalysis().cvInclusionId;
				self.targetCaption = self.currentPlpAnalysis().cvInclusionCaption;
				self.targetExpression = self.currentPlpAnalysis().cvInclusionConceptSet;
				self.targetConceptSetSQL = self.currentPlpAnalysis().cvInclusionConceptSetSQL;
			}

			self.clearPsExclusion = function () {
				self.currentPlpAnalysis().cvExclusionId(0);
				self.currentPlpAnalysis().cvExclusionCaption(null);
				self.currentPlpAnalysis().cvExclusionConceptSet.removeAll();
				self.currentPlpAnalysis().cvExclusionConceptSetSQL(null);
			}

			self.clearPsInclusion = function () {
				self.currentPlpAnalysis().cvInclusionId(0);
				self.currentPlpAnalysis().cvInclusionCaption(null);
				self.currentPlpAnalysis().cvInclusionConceptSet.removeAll();
				self.currentPlpAnalysis().cvInclusionConceptSetSQL(null);
			}

			self.clearTreatment = function () {
				self.currentPlpAnalysis().treatmentId(0);
				self.currentPlpAnalysis().treatmentCaption(null);
				self.currentPlpAnalysis().treatmentCohortDefinition(null);
			}

			self.clearOutcome = function () {
				self.currentPlpAnalysis().outcomeId(0);
				self.currentPlpAnalysis().outcomeCaption(null);
				self.currentPlpAnalysis().outcomeCohortDefinition(null);
			}

			self.modelSettingExists = function (settingName) {
				settingList = self.currentPlpAnalysis().modelTypeSettings().filter(function (item) {
					return item.setting == settingName;
				});
				return (settingList.length > 0);
			}

			self.modelSettingDescription = function (settingName) {
				settingList = self.currentPlpAnalysis().modelTypeSettings().filter(function (item) {
					return item.setting == settingName;
				});
				if (settingList.length > 0) {
					return settingList[0].description + " (default = " + settingList[0].defaultValue + "):";
				} else {
					return "SETTING NOT FOUND!!";
				}
			}

			self.resetToDefault = function (settingName) {
				var currentSetting = self.currentPlpAnalysis().getCurrentModelSettingsByName(settingName);
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
