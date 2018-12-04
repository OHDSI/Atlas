define(function (require, exports) {

	var ko = require('knockout');

	// require depedent datatypes here
	const observeName = function (cohortLink) {
		cohortLink.name = ko.observable(cohortLink.name);
		return cohortLink;
	}
	
	class PathwayAnalysis {
		constructor(d) {

			let data = d || {};

			Object.assign(this, data);

			this.name = ko.observable(data.name || 'New Cohort Pathway');
			this.targetCohorts = ko.observableArray(data.targetCohorts && data.targetCohorts.map(observeName));
			this.eventCohorts = ko.observableArray(data.eventCohorts && data.eventCohorts.map(observeName));
			
			this.combinationWindow = ko.observable(data.combinationWindow||0);
			this.combinationWindow.numericValue = this.combinationWindow.numeric();
			
			this.minCellCount = ko.observable(data.minCellCount||0);
			this.minCellCount.numericValue = this.minCellCount.numeric();
			
			this.maxDepth = ko.observable(data.maxDepth||5);
			this.maxDepth.numericValue = this.maxDepth.numeric();
		}

	}
	return PathwayAnalysis;
});
