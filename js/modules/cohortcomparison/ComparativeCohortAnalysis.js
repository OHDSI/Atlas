define(function (require, exports) {

	var ko = require('knockout');

	function ComparativeCohortAnalysis(data) {
		var self = this;
		var data = data || {};

		self.name = ko.observable(data.name || null);

		self.comparatorCaption = ko.observable(data.comparatorCaption || null);
		self.comparatorId = ko.observable(data.comparatorId || null);
		
		self.treatmentCaption = ko.observable(data.treatmentCaption || null);
		self.treatmentId = ko.observable(data.treatmentId || null);
		
		self.exclusionCaption = ko.observable(data.exclusionCaption || null);
		self.exclusionId = ko.observable(data.exclusionId || null);
		
		self.outcomeCaption = ko.observable(data.outcomeCaption || null);
		self.outcomeId = ko.observable(data.outcomeId || null);
		
		self.timeAtRisk = ko.observable(data.timeAtRisk||null);
		
	}
	return ComparativeCohortAnalysis;
});