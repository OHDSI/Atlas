define([
	'knockout', 
	'databindings',
], function (
    ko
) {
	class GradientBoostingMachineSettings {
        constructor(data = {}) {
            this.ntrees = ko.observableArray((data.ntrees && Array.isArray(data.ntrees)) ? data.ntrees : []);
            this.nthread = ko.observable(data.nthread === 0 ? 0 : data.nthread || 20);
            this.maxDepth = ko.observableArray((data.maxDepth && Array.isArray(data.maxDepth)) ? data.maxDepth : []);
            this.minRows = ko.observableArray(data.minRows && Array.isArray(data.minRows) ? data.minRows : [20]);
            this.learnRate = ko.observableArray((data.learnRate && Array.isArray(data.learnRate)) ? data.learnRate : []);
            this.seed = ko.observable(data.seed || null);
        }
    }
	
	return GradientBoostingMachineSettings;
});