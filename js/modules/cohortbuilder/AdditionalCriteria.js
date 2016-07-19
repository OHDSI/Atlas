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
		self.Occurrence = new Occurrence(data.Occurrence);
	}
	
	module.exports = AdditionalCriteria;

});