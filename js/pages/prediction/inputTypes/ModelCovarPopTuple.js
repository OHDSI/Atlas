define([
	'knockout',
], function (
	ko
) {
	class ModelCovarPopTuple {
        constructor(data = {}) {
            this.modelName = data.modelName || null;
            this.modelSettings = data.modelSettings || null;
            this.covariateSettings = data.covariateSettings ||null;
            this.popRiskWindowStart = data.popRiskWindowStart || null;
            this.popRiskWindowEnd = data.popRiskWindowEnd || null;
        }
	}
	
	return ModelCovarPopTuple;
});