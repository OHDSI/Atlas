define(function (require, exports) {

	var ko = require('knockout');
	var CriteriaGroup = require('components/cohortbuilder/CriteriaGroup');
	
	function InclusionRule(data, conceptSets) {
		
		var self = this;
		var data = data || {};

		self.name = ko.observable(data.name || null);
		self.description = ko.observable(data.description || null);
		self.expression = new CriteriaGroup(data.expression, conceptSets);
	}
	
	return InclusionRule;
});