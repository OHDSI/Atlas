define([
	'knockout', 
	'text!./TargetOutcomesEditor.html',	
	'providers/Component',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
) {
	class TargetOutcomesEditor extends Component {
		constructor(params) {
            super(params);

            this.cohortDefinitions = params.cohortDefinitions;
            this.targetOutcomes = params.targetOutcomes;

			this.chooseTarget = () => {
                /*
				$('#modalCohortDefinition').modal('show');
				self.targetId = self.patientLevelPrediction().treatmentId;
				self.targetCaption = self.patientLevelPrediction().treatmentCaption;
                self.targetCohortDefinition = self.patientLevelPrediction().treatmentCohortDefinition;
                */
			}

			this.chooseOutcome = () => {
                /*
				$('#modalCohortDefinition').modal('show');
				self.targetId = self.patientLevelPrediction().outcomeId;
				self.targetCaption = self.patientLevelPrediction().outcomeCaption;
                self.targetCohortDefinition = self.patientLevelPrediction().outcomeCohortDefinition;
                */
            }
            
			self.clearTarget = function () {
                /*
				self.patientLevelPrediction().cvInclusionId(0);
				self.patientLevelPrediction().cvInclusionCaption(null);
				self.patientLevelPrediction().cvInclusionConceptSet.removeAll();
                self.patientLevelPrediction().cvInclusionConceptSetSQL(null);
                */
			}

			self.clearOutcome = function () {
                /*
				self.patientLevelPrediction().cvInclusionId(0);
				self.patientLevelPrediction().cvInclusionCaption(null);
				self.patientLevelPrediction().cvInclusionConceptSet.removeAll();
                self.patientLevelPrediction().cvInclusionConceptSetSQL(null);
                */
			}
		}
	}

	return commonUtils.build('target-outcomes-editor', TargetOutcomesEditor, view);;
});