define(function (require, exports) {

    var TargetOutcome = require('./TargetOutcome');
    var ModelCovarPopTuple = require('./ModelCovarPopTuple');

	function FullAnalysis(targetOutcome, modelCovarPopTuple) {
        var self = this;
        
        if (typeof targetOutcome !== TargetOutcome) {
            targetOutcome = new TargetOutcome(targetOutcome);
        }
        if (typeof modelCovarPopTuple !== ModelCovarPopTuple) {
            modelCovarPopTuple = new ModelCovarPopTuple(modelCovarPopTuple);
        }
        
        self.targetOutcome = targetOutcome || null;
        self.modelCovarPopTuple = modelCovarPopTuple || null;
	}
	
	return FullAnalysis;
});