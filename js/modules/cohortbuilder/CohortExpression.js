define(function (require, exports) {

	var ko = require('knockout');
	var CriteriaGroup = require('./CriteriaGroup');
	var ConceptSet = require('conceptsetbuilder/InputTypes/ConceptSet');
	var PrimaryCriteria = require('./PrimaryCriteria');
	var InclusionRule = require('./InclusionRule');

	function conceptSetSorter(a,b)
	{
		var textA = a.name().toUpperCase();
		var textB = b.name().toUpperCase();
		return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
	}
	
	function CohortExpression(data) {
		var self = this;
		var data = data || {};

		
		self.ConceptSets = ko.observableArray(data.ConceptSets && data.ConceptSets.map(function(d) { return new ConceptSet(d) }));
		self.PrimaryCriteria = ko.observable(new PrimaryCriteria(data.PrimaryCriteria, self.ConceptSets));
		self.AdditionalCriteria = ko.observable(data.AdditionalCriteria && new CriteriaGroup(data.AdditionalCriteria, self.ConceptSets));
		self.ExpressionLimit =  { Type: ko.observable(data.ExpressionLimit && data.ExpressionLimit.Type || "All") }
		self.InclusionRules = ko.observableArray(data.InclusionRules && data.InclusionRules.map(function (rule) {
			return new InclusionRule(rule, self.ConceptSets);	
		}));
		self.ConceptSets.sorted = ko.pureComputed(function() {
			return self.ConceptSets().map(function (item) { return item; }).sort(conceptSetSorter);
		});
	
		
	}
	return CohortExpression;
});