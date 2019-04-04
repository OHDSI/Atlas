// AdditoinalCriteria.js - a wrapper for criteria that is used as Additional Criteria
define(function (require, exports, module) {
	var ko = require('knockout');
	var CriteriaTypes = require('./CriteriaTypes');		
	var Occurrence = require('./InputTypes/Occurrence');
	var Window = require('./InputTypes/Window');
	
	var debug = false;

	function AdditionalCriteria(data, conceptSets) {
		var self = this;
		
		data = data || {};
		self.Criteria = CriteriaTypes.GetCriteriaFromObject(data.Criteria, conceptSets);
		self.StartWindow = new Window(data.StartWindow);

		// for backwards compatability, if the data.EndWindow is populated, but useEventEnd is null, set useEventEnd = true
		var endWindowData = data.EndWindow;
		if (endWindowData && !endWindowData.hasOwnProperty("UseEventEnd")) {
			endWindowData.UseEventEnd = true;
		}		
		self.EndWindow = ko.observable(data.EndWindow && new Window(endWindowData));
		
		self.Occurrence = new Occurrence(data.Occurrence);
		self.RestrictVisit = ko.observable(data.RestrictVisit || false);
		self.IgnoreObservationPeriod = ko.observable(data.IgnoreObservationPeriod || false);
	}
	
	module.exports = AdditionalCriteria;

});