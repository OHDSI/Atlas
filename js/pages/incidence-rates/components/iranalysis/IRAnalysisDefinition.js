define(function (require, exports) {

	var ko = require('knockout');
	var IRAnalysisExpression = require('./IRAnalysisExpression');

	function IRAnalysisDefinition(data) {
		
		var self = this;
		var data = data || {};

		self.id = ko.observable(data.id || null);
		self.name = data.name ? ko.observable(data.name) : ko.i18n('const.newEntityNames.incidenceRate', 'New Incidence Rate Analysis');
		self.description = ko.observable(data.description || null);
		self.expression = ko.observable(new IRAnalysisExpression(data.expression))
		self.createdBy = ko.observable(data.createdBy || null);
	}
	return IRAnalysisDefinition;
});