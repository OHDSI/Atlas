define([
	'jquery',
	'knockout',
	'providers/Component',
	'providers/AutoBind',
	'utils/CommonUtils',
	'text!./plp-spec-editor.html',
	'services/CohortDefinitionService',
	'plp/PatientLevelPredictionAnalysis',
	'plp/options',
	'components/cohortbuilder/CohortExpression',
	'services/VocabularyService',
	'conceptsetbuilder/InputTypes/ConceptSet',
],
	function (
		$,
		ko,
		Component,
		AutoBind,
		commonUtils,
		view,
		cohortDefinitionService,
		PatientLevelPredictionAnalysis,
		options,
		CohortExpression,
		VocabularyService,
		ConceptSet,
	) {
		class PlpSpecEditor extends AutoBind(Component) {
			constructor(params) {
				super(params);
				this.currentPlpAnalysis = params.currentPlpAnalysis;
				this.patientLevelPredictionDirtyFlag = params.dirtyFlag;
				this.options = options;
			}

			async cohortSelected(id) {
				$('#modalCohortDefinition').modal('hide');
				const cohortDefinition = await cohortDefinitionService.findOne(id);
				this.targetId(cohortDefinition.id);
				this.targetCaption(cohortDefinition.name);
				cohortDefinition.expression = JSON.parse(cohortDefinition.expression);
				this.targetCohortDefinition(new CohortExpression(cohortDefinition));
			}

			conceptsetSelected(d) {
				$('#modalConceptSet').modal('hide');
				VocabularyService.getConceptSetExpression(d.id).then(({ data: csExpression }) => {
					this.targetId(d.id);
					this.targetCaption(d.name);
					var conceptSetData = new ConceptSet({
						id: d.id,
						name: d.name,
						expression: csExpression
					});
					this.targetExpression.removeAll();
					this.targetExpression.push(conceptSetData);

					VocabularyService.getConceptSetExpressionSQL(csExpression).then(
						({ data }) => {
							this.targetConceptSetSQL(data);
						});
				});
			}

			chooseTreatment() {
				$('#modalCohortDefinition').modal('show');
				this.targetId = this.currentPlpAnalysis().treatmentId;
				this.targetCaption = this.currentPlpAnalysis().treatmentCaption;
				this.targetCohortDefinition = this.currentPlpAnalysis().treatmentCohortDefinition;
			}

			chooseOutcome() {
				$('#modalCohortDefinition').modal('show');
				this.targetId = this.currentPlpAnalysis().outcomeId;
				this.targetCaption = this.currentPlpAnalysis().outcomeCaption;
				this.targetCohortDefinition = this.currentPlpAnalysis().outcomeCohortDefinition;
			}

			choosePsExclusion() {
				$('#modalConceptSet').modal('show');
				this.targetId = this.currentPlpAnalysis().cvExclusionId;
				this.targetCaption = this.currentPlpAnalysis().cvExclusionCaption;
				this.targetExpression = this.currentPlpAnalysis().cvExclusionConceptSet;
				this.targetConceptSetSQL = this.currentPlpAnalysis().cvExclusionConceptSetSQL;
			}

			choosePsInclusion() {
				$('#modalConceptSet').modal('show');
				this.targetId = this.currentPlpAnalysis().cvInclusionId;
				this.targetCaption = this.currentPlpAnalysis().cvInclusionCaption;
				this.targetExpression = this.currentPlpAnalysis().cvInclusionConceptSet;
				this.targetConceptSetSQL = this.currentPlpAnalysis().cvInclusionConceptSetSQL;
			}

			clearPsExclusion() {
				this.currentPlpAnalysis().cvExclusionId(0);
				this.currentPlpAnalysis().cvExclusionCaption(null);
				this.currentPlpAnalysis().cvExclusionConceptSet.removeAll();
				this.currentPlpAnalysis().cvExclusionConceptSetSQL(null);
			}

			clearPsInclusion() {
				this.currentPlpAnalysis().cvInclusionId(0);
				this.currentPlpAnalysis().cvInclusionCaption(null);
				this.currentPlpAnalysis().cvInclusionConceptSet.removeAll();
				this.currentPlpAnalysis().cvInclusionConceptSetSQL(null);
			}

			clearTreatment() {
				this.currentPlpAnalysis().treatmentId(0);
				this.currentPlpAnalysis().treatmentCaption(null);
				this.currentPlpAnalysis().treatmentCohortDefinition(null);
			}

			clearOutcome() {
				this.currentPlpAnalysis().outcomeId(0);
				this.currentPlpAnalysis().outcomeCaption(null);
				this.currentPlpAnalysis().outcomeCohortDefinition(null);
			}

			modelSettingExists(settingName) {
				const settingList = this.currentPlpAnalysis().modelTypeSettings().filter(function (item) {
					return item.setting == settingName;
				});
				return (settingList.length > 0);
			}

			modelSettingDescription(settingName) {
				const settingList = this.currentPlpAnalysis().modelTypeSettings().filter(function (item) {
					return item.setting == settingName;
				});
				if (settingList.length > 0) {
					return settingList[0].description + " (default = " + settingList[0].defaultValue + "):";
				} else {
					return "SETTING NOT FOUND!!";
				}
			}

			resetToDefault(settingName) {
				var currentSetting = this.currentPlpAnalysis().getCurrentModelSettingsByName(settingName);
				if (currentSetting && currentSetting.length > 0) {
					currentSetting[0].reference(currentSetting[0].defaultValue);
				}
			}
		}

		return commonUtils.build('plp-spec-editor', PlpSpecEditor, view);

	});
