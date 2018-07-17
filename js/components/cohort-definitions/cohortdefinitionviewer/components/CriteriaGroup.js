define(['knockout', 'cohortbuilder/CriteriaTypes','cohortbuilder/CriteriaGroup', 'cohortbuilder/AdditionalCriteria', 'cohortbuilder/options', 'text!./CriteriaGroupTemplate.html'], function (ko, criteriaTypes, CriteriaGroup, AdditionalCriteria, options, template) {

	function CriteriaGroupViewModel(params) {
		var self = this;

		self.expression = params.expression;
    //if (!params.parentGroup) debugger;
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
			else
				return "unknown-criteria";
		};
		
		self.groupType = ko.pureComputed(function() {
			return self.options.groupTypeOptions.filter(function(item) {
				return item.id == self.group().Type();
			})[0].name;
		});
		
		self.getOccurrenceType = function(occurenceType) {
			return self.options.occurrenceTypeOptions.filter(function(item) {
				return item.id == occurenceType;
			})[0].name;
		};
		
		
	}

	// return compoonent definition
	return {
		viewModel: CriteriaGroupViewModel,
		template: template
	};
});
