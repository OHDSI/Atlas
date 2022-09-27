define(function (require, exports) {

	var ko = require('knockout');
	var CriteriaGroup = require('./CriteriaGroup');
	var ConceptSet = require('components/conceptset/InputTypes/ConceptSet');
	var PrimaryCriteria = require('./PrimaryCriteria');
	var InclusionRule = require('./InclusionRule');
	var EndStrategies = require('./EndStrategies');
	var CriteriaTypes = require('./CriteriaTypes');
	var Period = require('./InputTypes/Period');
	
	function CohortExpression(data) {
		var self = this;
		var data = data || {};

		
		self.ConceptSets = ko.observableArray(data.ConceptSets && data.ConceptSets.map(function(d) { return new ConceptSet(d) }));
		self.PrimaryCriteria = ko.observable(new PrimaryCriteria(data.PrimaryCriteria, self.ConceptSets));
		self.AdditionalCriteria = ko.observable(data.AdditionalCriteria && new CriteriaGroup(data.AdditionalCriteria, self.ConceptSets));
		self.QualifiedLimit =  { Type: ko.observable(data.QualifiedLimit && data.QualifiedLimit.Type || "First") }
		self.ExpressionLimit =  { Type: ko.observable(data.ExpressionLimit && data.ExpressionLimit.Type || "First") }
		self.InclusionRules = ko.observableArray(data.InclusionRules && data.InclusionRules.map(function (rule) {
			return new InclusionRule(rule, self.ConceptSets);	
		}));
		self.EndStrategy = ko.observable(data.EndStrategy && EndStrategies.GetStrategyFromObject(data.EndStrategy, self.ConceptSets));

		self.CensoringCriteria = ko.observableArray(data.CensoringCriteria && data.CensoringCriteria.map(function (criteria) {
			return CriteriaTypes.GetCriteriaFromObject(criteria, self.ConceptSets);
		}));
		self.CollapseSettings = {CollapseType: ko.observable(data.CollapseSettings && data.CollapseSettings.CollapseType || "ERA"), EraPad: ko.observable(data.CollapseSettings && data.CollapseSettings.EraPad || 0 ) }
		self.CensorWindow = ko.observable(new Period(data.CensorWindow));

		self.cdmVersionRange = data.cdmVersionRange || null;
	}
	return CohortExpression;
});