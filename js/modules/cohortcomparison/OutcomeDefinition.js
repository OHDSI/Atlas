define(function (require, exports) {

	var $ = require('jquery');
	var ko = require('knockout');
	var CohortDefinition = require('cohortbuilder/CohortDefinition')

	function OutcomeDefinition(data, cohortList) {
		var self = this;
		var data = data || {};
		var cohortData;

		self.id = data.id;
		self.outcomeId = ko.observable(data.outcomeId != null ? data.outcomeId : 0);
		self.outcomeCaption = ko.observable(null);
		self.outcomeCohortDefinition = ko.observable(null);
		if (cohortList && cohortList.length > 0) {
			var selectedCohort = $.grep(cohortList, function (f) {
				return f.id == data.outcomeId;
			});
			if (selectedCohort.length > 0) {
				self.outcomeCaption(selectedCohort[0].name);
				cohortData = {
					id: selectedCohort[0].id,
					name: selectedCohort[0].name,
					expression: JSON.parse(selectedCohort[0].expression),
				}
				self.outcomeCohortDefinition(new CohortDefinition(cohortData));
			}
		}
		
		self.jsonify = function() { 
			return {
				id: self.id,
				outcomeId: self.outcomeId(),
			}
		}
	}

	return OutcomeDefinition;
});
