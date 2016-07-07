define(['knockout', '../options', '../InputTypes/Range', '../InputTypes/Text', 'text!./DeviceExposureTemplate.html'], function (ko, options, Range, Text, template) {

	function DeviceExposureViewModel(params) {
		var self = this;

		var addActions = [
			{
				text: "Add Device Exposure Start Date Filter",
				value: 0,
				selected: false,
				description: "Filter Procedure Occurrences by the Procedure Start Date."
			},
			{
				text: "Add Device Exposure End Date Filter",
				value: 1,
				selected: false,
				description: "Filter Device Exposure by the Procedure Start Date."
			},			
			{
				text: "Add Device Type Filter",
				value: 2,
				selected: false,
				description: "Filter Procedure Occurrences  by the Procedure Type."
			},
			{
				text: "Add Unique Id Filter",
				value: 3,
				selected: false,
				description: "Filter Device Exposures by Device Unique Id."
			},			
			{
				text: "Add Quantity Filter",
				value: 4,
				selected: false,
				description: "Filter Device Exposures by Quantity."
					},
			{
				text: "Add Device Source Concept Filter",
				value: 5,
				selected: false,
				description: "Filter Device Exposures by the Device Source Concept."
					},
			{
				text: "Add New Exposure Filter",
				value: 6,
				selected: false,
				description: "Limit Device Exposures to first exposure."
			},
			{
				text: "Add Age at Occurrence Filter",
				value: 7,
				selected: false,
				description: "Filter Device Exposures by age at occurrence."
			}, 
			{
				text: "Add Gender Filter",
				value: 8,
				selected: false,
				description: "Filter Device Exposures based on Gender."
			},
/*
 			{
				text: "Add Prior Observation Duration Filter",
				value: 8,
				selected: false,
				description: "Filter Procedure Occurrences based on Prior Observation Duration."
					},
			{
				text: "Add Post Observation Duration Filter",
				value: 9,
				selected: false,
				description: "Filter Procedure Occurrences based on Prior Observation Duration."
					},
*/
			{
				text: "Add Provider Specialty Filter",
				value: 9,
				selected: false,
				description: "Filter Device Exposures based on provider specialty."
					},
			{
				text: "Add Visit Filter",
				value: 10,
				selected: false,
				description: "Filter Device Exposures based on visit occurrence of exposure."
			}
		];

		self.addCriterionSettings = {
			selectText: "Add Filter...",
			height:300,
			actionOptions: addActions,
			onAction: function (data) {
				var criteriaType = data.selectedData.value;
				switch (criteriaType) {
				case 0:
					if (self.Criteria.OccurrenceStartDate() == null)
						self.Criteria.OccurrenceStartDate(new Range({Op: "lt"}));
					break;
				case 1:
					if (self.Criteria.OccurrenceEndDate() == null)
						self.Criteria.OccurrenceEndDate(new Range({Op: "lt"}));
					break;
				case 2:
					if (self.Criteria.DeviceType() == null)
						self.Criteria.DeviceType(ko.observableArray());
					break;
				case 3:
					if (self.Criteria.UniqueDeviceId() == null)
						self.Criteria.UniqueDeviceId(new Text({Op: "contains"}));
					break;
				case 4:
					if (self.Criteria.Quantity() == null)
						self.Criteria.Quantity(new Range({Op: "lt"}));
					break;
				case 5:
					if (self.Criteria.DeviceSourceConcept() == null)
						self.Criteria.DeviceSourceConcept(ko.observable());
					break;
				case 6:
					if (self.Criteria.First() == null)
						self.Criteria.First(true);
					break;
				case 7:
					if (self.Criteria.Age() == null)
						self.Criteria.Age(new Range());
					break;
				case 8:
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());
					break;
/*
 				case 8:
					if (typeof self.Criteria.PriorEnrollDays() != "number")
						self.Criteria.PriorEnrollDays(0);
					break;
				case 9:
					if (typeof self.Criteria.AfterEnrollDays() != "number")
						self.Criteria.AfterEnrollDays(0);
					break;
*/
				case 9:
					if (self.Criteria.ProviderSpecialty() == null)
						self.Criteria.ProviderSpecialty(ko.observableArray());
					break;
				case 10:
					if (self.Criteria.VisitType() == null)
						self.Criteria.VisitType(ko.observableArray());
					break;
				}
			}
		};

		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.DeviceExposure;
		self.options = options;

		self.removeCriterion = function (propertyName) {
			self.Criteria[propertyName](null);
		}


	}

	// return compoonent definition
	return {
		viewModel: DeviceExposureViewModel,
		template: template
	};
});