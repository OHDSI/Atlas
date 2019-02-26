define([
	'knockout', 
	'databindings',
], function (
	ko
) {
	class LassoLogisticRegressionSettings {
		constructor(data = {}) {
			this.variance = ko.observable(data.variance === 0 ? 0 : data.variance || 0.01).extend({numeric: 9});
			this.seed = ko.observable(data.seed || null);
		}
    }
	
	return LassoLogisticRegressionSettings;
});