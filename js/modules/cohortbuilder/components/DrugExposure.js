define(['knockout', '../options', '../InputTypes/Range', '../InputTypes/Text', '../CriteriaGroup', 'text!./DrugExposureTemplate.html'], function (ko, options, Range, Text, CriteriaGroup, template) {

	function DrugExposureViewModel(params) {
		var self = this;
		self.formatOption = function (d) {
			return '<div class="optionText">' + d.text + '</div>' +
				'<div class="optionDescription">' + d.description + '</div>';
		};

		self.addActions = [{
				text: "Add First Exposure Criteria",
				value: 5,
				selected: false,
				description: "Limit Drug Exposures to the first exposure in history."
			},
			{
				text: "Add Age at Occurrence Criteria",
				value: 6,
				selected: false,
				description: "Filter Drug Exposures by age at occurrence."
			},
			{
				text: "Add Gender Criteria",
				value: 7,
				selected: false,
				description: "Filter Drug Exposures based on Gender."
			},
			{
				text: "Add Start Date Criteria",
				value: 0,
				selected: false,
				description: "Filter Drug Exposures by the Drug Exposure Start Date."
			},
			{
				text: "Add End Date Criteria",
				value: 1,
				selected: false,
				description: "Filter Drug Exposures  by the Drug Exposure End Date"
			},
			{
				text: "Add Drug Type Criteria",
				value: 2,
				selected: false,
				description: "Filter Drug Exposures  by the Drug Type."
			},
			{
				text: "Add Visit Criteria",
				value: 11,
				selected: false,
				description: "Filter Drug Exposures based on visit occurrence of drug exposure."
			},
			{
				text: "Add Stop Reason Criteria",
				value: 3,
				selected: false,
				description: "Filter Drug Exposures  by the Stop Reason."
			},
			{
				text: "Add Refills Criteria",
				value: 12,
				selected: false,
				description: "Filter Drug Exposures by Refills."
			},
			{
				text: "Add Quantity Criteria",
				value: 13,
				selected: false,
				description: "Filter Drug Exposures by Quantity."
			},
			{
				text: "Add Days Supply Criteria",
				value: 14,
				selected: false,
				description: "Filter Drug Exposures by Days Supply."
			},
			{
				text: "Add Route Criteria",
				value: 15,
				selected: false,
				description: "Filter Drug Exposures by Route."
			},
			{
				text: "Add Effective Dose Criteria",
				value: 16,
				selected: false,
				description: "Filter Drug Exposures by Effective Dose."
			},
			{
				text: "Add Dose Unit Criteria",
				value: 17,
				selected: false,
				description: "Filter Drug Exposures by Dose Unit."
			},
			{
				text: "Add Lot Number Criteria",
				value: 18,
				selected: false,
				description: "Filter Drug Exposures by Lot Number."
			},
			{
				text: "Add Drug Source Concept Criteria",
				value: 4,
				selected: false,
				description: "Filter Drug Exposures by the Drug Source Concept."
			},
			/*
			 			{
							text: "Add Prior Observation Duration Criteria",
							value: 8,
							selected: false,
							description: "Filter Drug Exposures based on Prior Observation Duration."
								},
						{
							text: "Add Post Observation Duration Criteria",
							value: 9,
							selected: false,
							description: "Filter Drug Exposures based on Prior Observation Duration."
								},
			*/
			{
				text: "Add Provider Specialty Criteria",
				value: 10,
				selected: false,
				description: "Filter Drug Exposures based on provider specialty."
			},
			{
				text: "Add Nested Criteria...",
				value: 19,
				selected: false,
				description: "Apply criteria using the condition occurrence as the index date",
			}
		];

		self.actionHandler = function (data) {
			var criteriaType = data.value;
			switch (criteriaType) {
				case 0:
					if (self.Criteria.OccurrenceStartDate() == null)
						self.Criteria.OccurrenceStartDate(new Range({
							Op: "lt"
						}));
					break;
				case 1:
					if (self.Criteria.OccurrenceEndDate() == null)
						self.Criteria.OccurrenceEndDate(new Range({
							Op: "lt"
						}));
					break;
				case 2:
					if (self.Criteria.DrugType() == null)
						self.Criteria.DrugType(ko.observableArray());
					break;
				case 3:
					if (self.Criteria.StopReason() == null)
						self.Criteria.StopReason(new Text({
							Op: "contains"
						}));
					break;
				case 12:
					if (self.Criteria.Refills() == null)
						self.Criteria.Refills(new Range({
							Op: "lt"
						}));
					break;
				case 13:
					if (self.Criteria.Quantity() == null)
						self.Criteria.Quantity(new Range({
							Op: "lt"
						}));
					break;
				case 14:
					if (self.Criteria.DaysSupply() == null)
						self.Criteria.DaysSupply(new Range({
							Op: "lt"
						}));
					break;
				case 15:
					if (self.Criteria.RouteConcept() == null)
						self.Criteria.RouteConcept(ko.observableArray());
					break;
				case 16:
					if (self.Criteria.EffectiveDrugDose() == null)
						self.Criteria.EffectiveDrugDose(new Range({
							Op: "lt"
						}));
					break;
				case 17:
					if (self.Criteria.DoseUnit() == null)
						self.Criteria.DoseUnit(ko.observableArray());
					break;
				case 18:
					if (self.Criteria.LotNumber() == null)
						self.Criteria.LotNumber(new Text({
							Op: "contains"
						}));
					break;
				case 4:
					if (self.Criteria.DrugSourceConcept() == null)
						self.Criteria.DrugSourceConcept(ko.observable());
					break;
				case 5:
					if (self.Criteria.First() == null)
						self.Criteria.First(true);
					break;
				case 6:
					if (self.Criteria.Age() == null)
						self.Criteria.Age(new Range());
					break;
				case 7:
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
				case 10:
					if (self.Criteria.ProviderSpecialty() == null)
						self.Criteria.ProviderSpecialty(ko.observableArray());
					break;
				case 11:
					if (self.Criteria.VisitType() == null)
						self.Criteria.VisitType(ko.observableArray());
					break;
				case 19:
					if (self.Criteria.CorrelatedCriteria() == null)
						self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
					break;
			}
		}

		self.addCriterionSettings = {
			selectText: "Add criteria attribute…",
			height: 300,
			actionOptions: self.addActions,
			onAction: self.actionHandler
		};

		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.DrugExposure;
		self.options = options;

		self.removeCriterion = function (propertyName) {
			self.Criteria[propertyName](null);
		}


	}

	// return compoonent definition
	return {
		viewModel: DrugExposureViewModel,
		template: template
	};
});
