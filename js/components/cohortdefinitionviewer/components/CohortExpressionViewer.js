define(['knockout', 'components/cohortbuilder/options', 'text!./CohortExpressionViewerTemplate.html'], 
			 function (ko, options, template) {
		
	function CohortExpressionEditorViewModel(params) {
		var self = this;

		self.expression = params.expression;
		self.options = options;

		self.getLimitTypeText = function(typeId)
		{
			return options.resultLimitOptions.filter(function (item) {
				return item.id == typeId;
			})[0].name;
		}
		self.getCriteriaIndexComponent = function (data) {
			data = ko.utils.unwrapObservable(data);
			if (data.hasOwnProperty("ConditionOccurrence"))
				return "condition-occurrence-criteria-viewer";
			else if (data.hasOwnProperty("ConditionEra"))
				return "condition-era-criteria-viewer";
			else if (data.hasOwnProperty("DrugExposure"))
				return "drug-exposure-criteria-viewer";
			else if (data.hasOwnProperty("DrugEra"))
				return "drug-era-criteria-viewer";
			else if (data.hasOwnProperty("DoseEra"))
				return "dose-era-criteria-viewer";
			else if (data.hasOwnProperty("ProcedureOccurrence"))
				return "procedure-occurrence-criteria-viewer";
			else if (data.hasOwnProperty("Observation"))
				return "observation-criteria-viewer";			
			else if (data.hasOwnProperty("VisitOccurrence"))
				return "visit-occurrence-criteria-viewer";			
			else if (data.hasOwnProperty("DeviceExposure"))
				return "device-exposure-criteria-viewer";			
			else if (data.hasOwnProperty("Measurement"))
				return "measurement-criteria-viewer";
			else if (data.hasOwnProperty("Specimen"))
				return "specimen-criteria-viewer";
			else if (data.hasOwnProperty("ObservationPeriod"))
				return "observation-period-criteria-viewer";
			else if (data.hasOwnProperty("PayerPlanPeriod"))
				return "payer-plan-period-criteria-viewer";
			else if (data.hasOwnProperty("Death"))
				return "death-criteria-viewer";
			else if (data.hasOwnProperty("LocationRegion"))
				return "location-region-viewer";
			else
				return "unknownCriteriaType";
		};
	}

	// return factory
	return {
		viewModel: CohortExpressionEditorViewModel,
		template: template
	};
});
