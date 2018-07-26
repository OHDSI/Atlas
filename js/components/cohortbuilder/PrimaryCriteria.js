// AdditoinalCriteria.js - a wrapper for criteria that is used as Additional Criteria
define(function (require, exports, module) {
	var ko = require('knockout');
	var CriteriaTypes = require('./CriteriaTypes');		

	function PrimaryCriteria(data, conceptSets) {
		var self = this;
		
		data = data || {};
		self.CriteriaList = ko.observableArray(data.CriteriaList && data.CriteriaList.map(function (d) {
			return CriteriaTypes.GetCriteriaFromObject(d, conceptSets)
		}));
		
		self.ObservationWindow = { PriorDays: ko.observable((data.ObservationWindow && data.ObservationWindow.PriorDays) || 0),
																PostDays: ko.observable((data.ObservationWindow && data.ObservationWindow.PostDays) || 0) };
		
		self.PrimaryCriteriaLimit = { Type: ko.observable(data.PrimaryCriteriaLimit && data.PrimaryCriteriaLimit.Type || "First") }
		
	}
	
	module.exports = PrimaryCriteria;
	
});