define(['knockout', '../InputTypes/Range','conceptpicker/InputTypes/Concept', '../InputTypes/Text', '../CriteriaGroup'], function (ko, Range, Concept, Text, CriteriaGroup) {

	function Criteria (data, conceptSets) {
		var self = this;
		var data = data || {};
		
		self.CorrelatedCriteria = ko.observable(data.CorrelatedCriteria && new CriteriaGroup(data.CorrelatedCriteria, conceptSets));

	}
	
	return Criteria;
	
});