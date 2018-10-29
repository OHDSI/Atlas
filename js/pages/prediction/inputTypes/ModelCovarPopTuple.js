define(function (require, exports) {

	function ModelCovarPopTuple(data) {
		var self = this;
        data = data || {};
        
        self.modelName = data.modelName || null;
        self.modelSettings = data.modelSettings || null;
        self.covariateSettings = data.covariateSettings ||null;
        self.popRiskWindowStart = data.popRiskWindowStart || null;
        self.popRiskWindowEnd = data.popRiskWindowEnd || null;
	}
	
	return ModelCovarPopTuple;
});