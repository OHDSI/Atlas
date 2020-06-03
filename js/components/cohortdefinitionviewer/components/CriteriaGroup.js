define(['knockout','components/cohortbuilder/CriteriaTypes','components/cohortbuilder/CriteriaGroup','components/cohortbuilder/AdditionalCriteria','components/cohortbuilder/options', 'text!./CriteriaGroupTemplate.html'], function (ko, criteriaTypes, CriteriaGroup, AdditionalCriteria, options, template) {

	function CriteriaGroupViewModel(params) {
		var self = this;

		self.expression = params.expression;
		self.group = params.group;
		self.parentGroup = params.parentGroup;
		self.options = options;
		self.selectedFragment = params.selectedFragment;

		self.getCriteriaComponent = function (data) {

			if (data.hasOwnProperty("Person"))
				return "person-criteria";
			else if (data.hasOwnProperty("ConditionOccurrence"))
				return "condition-occurrence-criteria-viewer";
			else if (data.hasOwnProperty("ConditionEra"))
				return "condition-era-criteria-viewer";
			else if (data.hasOwnProperty("DrugExposure"))
				return "drug-exposure-criteria-viewer";
			else if (data.hasOwnProperty("DrugEra"))
				return "drug-era-criteria-viewer";
			else if (data.hasOwnProperty("DoseEra"))
				return "dose-era-criteria-viewer";
			else if (data.hasOwnProperty("PayerPlanPeriod"))
				return "payer-plan-period-criteria-viewer";					
			else if (data.hasOwnProperty("ProcedureOccurrence"))
				return "procedure-occurrence-criteria-viewer";
			else if (data.hasOwnProperty("VisitOccurrence"))
				return "visit-occurrence-criteria-viewer";
			else if (data.hasOwnProperty("Observation"))
				return "observation-criteria-viewer";
			else if (data.hasOwnProperty("DeviceExposure"))
				return "device-exposure-criteria-viewer";
			else if (data.hasOwnProperty("Measurement"))
				return "measurement-criteria-viewer";
			else if (data.hasOwnProperty("Specimen"))
				return "specimen-criteria-viewer";
			else if (data.hasOwnProperty("ObservationPeriod"))
				return "observation-period-criteria-viewer";
			else if (data.hasOwnProperty("Death"))
				return "death-criteria-viewer";
			else if (data.hasOwnProperty("LocationRegion"))
				return "location-region-viewer";
			else
				return "unknown-criteria";
		};

		self.groupType = ko.pureComputed(function() {
			return ko.unwrap(self.options.groupTypeOptions.find((item) =>
			self.group() && item.id == self.group().Type()
		).name);
		});
		
		self.getOccurrenceType = function(occurenceType) {
			return ko.unwrap(self.options.occurrenceTypeOptions.find((item) =>
			item.id == occurenceType
		).name);
		};
		
		
	}

	// return compoonent definition
	return {
		viewModel: CriteriaGroupViewModel,
		template: template
	};
});
