define(function (require, exports, module) {
	var ko = require('knockout');
	var debug = true;

	var AdditionalCriteria = require('./AdditionalCriteria');
	var DemographicCriteria = require('./CriteriaTypes/DemographicCriteria');

	function CriteriaGroup(data, conceptSets) {
		var self = this;
		
		
		data = data || {};
		self.Type = ko.observable((data.Type) || "ALL");
		self.Count = ko.observable(data.Count || 0);
		self.CriteriaList = ko.observableArray();
		self.DemographicCriteriaList = ko.observableArray();
		self.Groups = ko.observableArray();

		// if data is provided, intialize the criteriaList
		if (data.CriteriaList && data.CriteriaList.length > 0) {
			data.CriteriaList.forEach(function (d) {
				self.CriteriaList.push(new AdditionalCriteria(d, conceptSets));
			});
		}
		
		if (data.DemographicCriteriaList && data.DemographicCriteriaList.length > 0) {
			data.DemographicCriteriaList.forEach(function (d) {
				self.DemographicCriteriaList.push(new DemographicCriteria(d));
			});
		}

		if (data.Groups && data.Groups.length > 0) {
			data.Groups.forEach(function (d) {
				self.Groups.push(new CriteriaGroup(d, conceptSets));
			});
		}

	}

	CriteriaGroup.prototype.toJSON = function () {
		if (!this.Type.startsWith("AT_")) {
			delete this.Count;
		}
		return this;
	}	
	module.exports = CriteriaGroup;
	
});