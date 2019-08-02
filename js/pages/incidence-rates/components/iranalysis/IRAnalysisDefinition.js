define(function (require, exports) {

	var ko = require('knockout');
	var IRAnalysisExpression = require('./IRAnalysisExpression');

	function IRAnalysisDefinition(data) {
		
		var self = this;
		var data = data || {};

		self.id = ko.observable(data.id || null);
		self.name = ko.observable(data.name || "New Incidence Rate Analysis");
		self.description = ko.observable(data.description || null);
		self.expression = ko.observable(new IRAnalysisExpression(data.expression))
		self.createdBy = ko.observable(data.createdBy || null);
	}
	return IRAnalysisDefinition;
});