define([
    './TargetOutcome',
    './ModelCovarPopTuple'
], function (
    TargetOutcome,
    ModelCovarPopTuple
) {
	class FullAnalysis {
        constructor(targetOutcome, modelCovarPopTuple) {
            if (typeof targetOutcome !== TargetOutcome) {
                targetOutcome = new TargetOutcome(targetOutcome);
            }
            if (typeof modelCovarPopTuple !== ModelCovarPopTuple) {
                modelCovarPopTuple = new ModelCovarPopTuple(modelCovarPopTuple);
            }
            
            this.targetOutcome = targetOutcome || null;
            this.modelCovarPopTuple = modelCovarPopTuple || null;
        }
	}
	
	return FullAnalysis;
});