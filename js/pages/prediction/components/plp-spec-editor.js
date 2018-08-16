define(['jquery', 'knockout', 'text!./plp-spec-editor.html', 'clipboard',
				'services/CohortDefinition', 'appConfig', 'assets/ohdsi.util',
				'plp/PatientLevelPredictionAnalysis', 'plp/options',
				'components/cohortbuilder/CohortExpression', 'vocabularyprovider',
				'conceptsetbuilder/InputTypes/ConceptSet'],
	function ($, ko, view, clipboard, cohortDefinitionService, config, ohdsiUtil,
		PatientLevelPredictionAnalysis, options, CohortExpression, vocabularyAPI,
		ConceptSet) {
		function plpSpecEditor(params) {
			var self = this;
			self.curentPlpAnalysis = params.curentPlpAnalysis;
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
						function (data) {
							self.targetConceptSetSQL(data);
						});
				});
			}

			self.chooseTreatment = function () {
				$('#modalCohortDefinition').modal('show');
				self.targetId = self.curentPlpAnalysis().treatmentId;
				self.targetCaption = self.curentPlpAnalysis().treatmentCaption;
				self.targetCohortDefinition = self.curentPlpAnalysis().treatmentCohortDefinition;
			}

			self.chooseOutcome = function () {
				$('#modalCohortDefinition').modal('show');
				self.targetId = self.curentPlpAnalysis().outcomeId;
				self.targetCaption = self.curentPlpAnalysis().outcomeCaption;
				self.targetCohortDefinition = self.curentPlpAnalysis().outcomeCohortDefinition;
			}

			self.choosePsExclusion = function () {
				$('#modalConceptSet').modal('show');
				self.targetId = self.curentPlpAnalysis().cvExclusionId;
				self.targetCaption = self.curentPlpAnalysis().cvExclusionCaption;
				self.targetExpression = self.curentPlpAnalysis().cvExclusionConceptSet;
				self.targetConceptSetSQL = self.curentPlpAnalysis().cvExclusionConceptSetSQL;
			}

			self.choosePsInclusion = function () {
				$('#modalConceptSet').modal('show');
				self.targetId = self.curentPlpAnalysis().cvInclusionId;
				self.targetCaption = self.curentPlpAnalysis().cvInclusionCaption;
				self.targetExpression = self.curentPlpAnalysis().cvInclusionConceptSet;
				self.targetConceptSetSQL = self.curentPlpAnalysis().cvInclusionConceptSetSQL;
			}

			self.clearPsExclusion = function () {
				self.curentPlpAnalysis().cvExclusionId(0);
				self.curentPlpAnalysis().cvExclusionCaption(null);
				self.curentPlpAnalysis().cvExclusionConceptSet.removeAll();
				self.curentPlpAnalysis().cvExclusionConceptSetSQL(null);
			}

			self.clearPsInclusion = function () {
				self.curentPlpAnalysis().cvInclusionId(0);
				self.curentPlpAnalysis().cvInclusionCaption(null);
				self.curentPlpAnalysis().cvInclusionConceptSet.removeAll();
				self.curentPlpAnalysis().cvInclusionConceptSetSQL(null);
			}

			self.clearTreatment = function () {
				self.curentPlpAnalysis().treatmentId(0);
				self.curentPlpAnalysis().treatmentCaption(null);
				self.curentPlpAnalysis().treatmentCohortDefinition(null);
			}

			self.clearOutcome = function () {
				self.curentPlpAnalysis().outcomeId(0);
				self.curentPlpAnalysis().outcomeCaption(null);
				self.curentPlpAnalysis().outcomeCohortDefinition(null);
			}

			self.modelSettingExists = function (settingName) {
				settingList = self.curentPlpAnalysis().modelTypeSettings().filter(function (item) {
					return item.setting == settingName;
				});
				return (settingList.length > 0);
			}

			self.modelSettingDescription = function (settingName) {
				settingList = self.curentPlpAnalysis().modelTypeSettings().filter(function (item) {
					return item.setting == settingName;
				});
				if (settingList.length > 0) {
					return settingList[0].description + " (default = " + settingList[0].defaultValue + "):";
				} else {
					return "SETTING NOT FOUND!!";
				}
			}

			self.resetToDefault = function (settingName) {
				var currentSetting = self.curentPlpAnalysis().getCurrentModelSettingsByName(settingName);
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
