define(['knockout','cohortbuilder/CriteriaGroup'], function(ko, CriteriaGroup) {

	var ko = require('knockout');
	var CriteriaGroup = require('cohortbuilder/CriteriaGroup');
	
	function StrataRule(data, conceptSets) {
		
		var self = this;
		var data = data || {};

		self.name = ko.observable(data.name || null);
		self.description = ko.observable(data.description || null);
		self.expression = new CriteriaGroup(data.expression, conceptSets);
	}
	
	return StrataRule;
});