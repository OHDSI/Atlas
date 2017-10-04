define(function (require, exports) {

	var $ = require('jquery');
	var ko = require('knockout');
	var CohortDefinition = require('cohortbuilder/CohortDefinition')
	var ConceptSet = require('conceptsetbuilder/InputTypes/ConceptSet')

	function TargetComparatorDefinition(data, cohortList, conceptSetList) {
		var self = this;
		var data = data || {};
		var conceptSetData;
		var cohortData;
		var selectedCohort;
		var selectedConceptSet;

		self.id = data.id;
		self.targetId = ko.observable(data.targetId != null ? data.targetId : 0);
		self.targetCaption = ko.observable(null);
		self.targetCohortDefinition = ko.observable(null);
		if (cohortList && cohortList.length > 0) {
			selectedCohort = $.grep(cohortList, function (f) {
				return f.id == data.targetId;
			});
			if (selectedCohort.length > 0) {
				self.targetCaption(selectedCohort[0].name);
				cohortData = {
					id: selectedCohort[0].id,
					name: selectedCohort[0].name,
					expression: JSON.parse(selectedCohort[0].expression),
				}
				self.targetCohortDefinition(new CohortDefinition(cohortData));
			}
		}

		self.comparatorId = ko.observable(data.comparatorId != null ? data.comparatorId : 0);
		self.comparatorCaption = ko.observable(null);
		self.comparatorCohortDefinition = ko.observable(null);
		if (cohortList && cohortList.length > 0) {
			selectedCohort = $.grep(cohortList, function (f) {
				return f.id == data.comparatorId;
			});
			if (selectedCohort.length > 0) {
				self.comparatorCaption(selectedCohort[0].name);
				cohortData = {
					id: selectedCohort[0].id,
					name: selectedCohort[0].name,
					expression: JSON.parse(selectedCohort[0].expression),
				}
				self.comparatorCohortDefinition(new CohortDefinition(cohortData));
			}
		}

		self.psExclusionId = ko.observable(data.psExclusionId != null ? data.psExclusionId : 0);
		self.psExclusionCaption = ko.observable(null);
		self.psExclusionConceptSet = ko.observableArray(null);
		self.psExclusionConceptSetSQL = ko.observable(null);
		if (conceptSetList && conceptSetList.length > 0) {
			selectedConceptSet = $.grep(conceptSetList, function (f) {
				return f.id == data.psExclusionId;
			});
			if (selectedConceptSet.length > 0) {
				self.psExclusionCaption(selectedConceptSet[0].name);
				conceptSetData = {
					id: self.psExclusionId(),
					name: self.psExclusionCaption(),
					expression: selectedConceptSet[0].expression,
				};
				self.psExclusionConceptSet.push(new ConceptSet(conceptSetData));
				self.psExclusionConceptSetSQL(selectedConceptSet[0].sql);
			}
		}

		self.psInclusionId = ko.observable(data.psInclusionId != null ? data.psInclusionId : 0);
		self.psInclusionCaption = ko.observable(null);
		self.psInclusionConceptSet = ko.observableArray(null);
		self.psInclusionConceptSetSQL = ko.observable(null);
		if (conceptSetList && conceptSetList.length > 0) {
			selectedConceptSet = $.grep(conceptSetList, function (f) {
				return f.id == data.psInclusionId;
			});
			if (selectedConceptSet.length > 0) {
				self.psInclusionCaption(selectedConceptSet[0].name);
				conceptSetData = {
					id: self.psInclusionId(),
					name: self.psInclusionCaption(),
					expression: selectedConceptSet[0].expression,
				};
				self.psInclusionConceptSet.push(new ConceptSet(conceptSetData));
				self.psInclusionConceptSetSQL(selectedConceptSet[0].sql);
			}
		}
		
		self.jsonify = function() {
			return {
				id: self.id,
				targetId: self.targetId(),
				comparatorId: self.comparatorId(),
				psExclusionId: self.psExclusionId(),
				psInclusionId: self.psInclusionId(),
			};
		}
	}

	return TargetComparatorDefinition;
});
