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
		self.CollapseSettings = {CollapseType: ko.observable(data.CollapseSettings && data.CollapseSettings.CollapseType || "ERA"), EraPad: ko.observable(data.CollapseSettings && data.CollapseSettings.EraPad || 0 ), EraPadUnitValue: ko.observable(data.CollapseSettings && data.CollapseSettings.EraPadUnitValue || 0), EraPadUnit: ko.observable(data.CollapseSettings && data.CollapseSettings.EraPadUnit || 'day')}
		self.CensorWindow = ko.observable(new Period(data.CensorWindow));

		self.cdmVersionRange = data.cdmVersionRange || null;

		self.CollapseSettings.EraPadUnitValue.subscribe(function (newValue){
			const insertValue = newValue.toString().replace(/[\D\.]/g, '');
			self.CollapseSettings.EraPadUnitValue(insertValue ? Number(insertValue) : 0);
			self.CollapseSettings.EraPadUnit() === 'day' && self.CollapseSettings.EraPad(insertValue ? Number(insertValue) : 0);
		})

		self.CollapseSettings.EraPadUnit.subscribe(function (newValue){
			self.CollapseSettings.EraPad(newValue === 'day' ? self.CollapseSettings.EraPadUnitValue() : 0);
		})

		self.UseDatetime = ko.observable(!!data.UseDatetime);
		
	}
	return CohortExpression;
});