define(['require', 'knockout', '../InputTypes/Range','conceptpicker/InputTypes/Concept', '../InputTypes/Text', '../InputTypes/DateAdjustment', '../CriteriaGroup'], function (require, ko, Range, Concept, Text, DateAdjustment) {

	function Criteria (data, conceptSets) {
		var self = this;
		var data = data || {};
		
		var CriteriaGroup = require('../CriteriaGroup');
		
		self.CorrelatedCriteria = ko.observable(data.CorrelatedCriteria && new CriteriaGroup(data.CorrelatedCriteria, conceptSets));
		self.DateAdjustment = ko.observable(data.DateAdjustment && new DateAdjustment(data.DateAdjustment));

	}
	
	return Criteria;
	
});