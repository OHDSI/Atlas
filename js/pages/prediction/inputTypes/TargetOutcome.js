define(function (require, exports) {

	function TargetOutcome(data) {
		var self = this;
        data = data || {};
        
        self.targetId = data.targetId || null;
        self.targetName = data.targetName || null;
        self.outcomeId = data.outcomeId ||null;
        self.outcomeName = data.outcomeName || null;
	}
	
	return TargetOutcome;
});