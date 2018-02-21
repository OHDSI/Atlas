define(['knockout', '../CriteriaTypes', '../CriteriaGroup', '../InputTypes/Window', '../AdditionalCriteria', '../options', 'text!./CriteriaGroupTemplate.html'], function (ko, criteriaTypes, CriteriaGroup, Window, AdditionalCriteria, options, template) {

	function CriteriaGroupViewModel(params) {
		var self = this;
		self.formatOption = function (d) {
			return '<div class="optionText">' + d.text + '</div>' +
				'<div class="optionDescription">' + d.description + '</div>';
		};
		self.addCriteriaActions = [{
				text: "Add Demographic Criteria",
				selected: false,
				description: "Filter events based on demographic criteria.",
				action: function () {
					self.addDemographicCriteria();
				}
			},
			{
				text: "Add Condition Era Criteria",
				selected: false,
				description: "Find patients with specific condition era.",
				action: function () {
					self.addConditionEraCriteria();
				}
			},
			{
				text: "Add Condition Occurrence Criteria",
				selected: false,
				description: "Find patients with specific conditions.",
				action: function () {
					self.addConditionCriteria();
				}
			},
			{
				text: "Add Death Criteria",
				selected: false,
				description: "Find patients based on death.",
				action: function () {
					self.addDeathCriteria();
				}
			},
			{
				text: "Add Device Exposure Criteria",
				selected: false,
				description: "Find patients based on device exposure.",
				action: function () {
					self.addDeviceCriteria();
				}
			},
			{
				text: "Add Dose Era Criteria",
				selected: false,
				description: "Find patients with dose eras.",
				action: function () {
					self.addDoseEraCriteria();
				}
			},
			{
				text: "Add Drug Era Criteria",
				selected: false,
				description: "Find patients with with drug eras.",
				action: function () {
					self.addDrugEraCriteria();
				}
			},
			{
				text: "Add Drug Exposure Criteria",
				selected: false,
				description: "Find patients with exposure to specific drugs or drug classes.",
				action: function () {
					self.addDrugExposureCriteria();
				}
			},
			{
				text: "Add Measurement Criteria",
				selected: false,
				description: "Find patients based on measurements.",
				action: function () {
					self.addMeasurementCriteria();
				}
			},
			{
				text: "Add Observation Criteria",
				selected: false,
				description: "Find patients based on observations.",
				action: function () {
					self.addObservationCriteria();
				}
			},
			{
				text: "Add Observation Period Criteria",
				selected: false,
				description: "Find patients based on observation periods.",
				action: function () {
					self.addObservationPeriodCriteria();
				}
			},
			{
				text: "Add Payer Plan Period Criteria",
				selected: false,
				description: "Find patients based on Payer Plan Period.",
				action: function () {
					self.addPayerPlanPeriodCriteria();
				}
			},
			{
				text: "Add Procedure Occurrence Criteria",
				selected: false,
				description: "Find patients that experienced a specific procedure.",
				action: function () {
					self.addProcedureCriteria();
				}
			},
			{
				text: "Add Specimen Criteria",
				selected: false,
				description: "Find patients based on specimen.",
				action: function () {
					self.addSpecimenCriteria();
				}
			},
			{
				text: "Add Visit Criteria",
				selected: false,
				description: "Find patients based on visit information.",
				action: function () {
					self.addVisitCriteria();
				}
			},
			{
				text: "Add Group",
				selected: false,
				description: "Add a group to combine criteria using and/or relationships.",
				action: function () {
					self.addAdditionalCriteria();
				}
			}
		];

		self.expression = params.expression;
		self.group = params.group;
		self.parentGroup = params.parentGroup;
		self.options = options;
		self.groupCountOptions = ko.pureComputed(function () {
			var optionsArray = ['0'];
			for (var i = 0; i < (self.group().CriteriaList().length + self.group().Groups().length); i++) {
				optionsArray.push("" + (i + 1));
			}
			return optionsArray;
		});

		self.getCriteriaComponent = function (data) {

			if (data.hasOwnProperty("Person"))
				return "person-criteria";
			else if (data.hasOwnProperty("ConditionOccurrence"))
				return "condition-occurrence-criteria";
			else if (data.hasOwnProperty("ConditionEra"))
				return "condition-era-criteria";
			else if (data.hasOwnProperty("DrugExposure"))
				return "drug-exposure-criteria";
			else if (data.hasOwnProperty("DrugEra"))
				return "drug-era-criteria";
			else if (data.hasOwnProperty("DoseEra"))
				return "dose-era-criteria";
			else if (data.hasOwnProperty("PayerPlanPeriod"))
				return "payer-plan-period-criteria";			
			else if (data.hasOwnProperty("ProcedureOccurrence"))
				return "procedure-occurrence-criteria";
			else if (data.hasOwnProperty("VisitOccurrence"))
				return "visit-occurrence-criteria";
			else if (data.hasOwnProperty("Observation"))
				return "observation-criteria";
			else if (data.hasOwnProperty("DeviceExposure"))
				return "device-exposure-criteria";
			else if (data.hasOwnProperty("Measurement"))
				return "measurement-criteria";
			else if (data.hasOwnProperty("Specimen"))
				return "specimen-criteria";
			else if (data.hasOwnProperty("ObservationPeriod"))
				return "observation-period-criteria";
			else if (data.hasOwnProperty("Death"))
				return "death-criteria";
			else
				return "unknown-criteria";
		};

		self.addAdditionalCriteria = function () {
			var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
			self.group().Groups.push(new CriteriaGroup(null, unwrappedExpression.ConceptSets));
		};

		self.addDemographicCriteria = function () {
			self.group().DemographicCriteriaList.push(new criteriaTypes.DemographicCriteria());
		}

		self.addConditionCriteria = function () {
			var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					ConditionOccurrence: {}
				}
			}, unwrappedExpression.ConceptSets));
		};

		self.addConditionEraCriteria = function () {
			var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					ConditionEra: {}
				}
			}, unwrappedExpression.ConceptSets));
		};

		self.addDrugExposureCriteria = function () {
			var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					DrugExposure: {}
				}
			}, unwrappedExpression.ConceptSets));
		};

		self.addDrugEraCriteria = function () {
			var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					DrugEra: {}
				}
			}, unwrappedExpression.ConceptSets));
		};

		self.addDoseEraCriteria = function () {
			var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					DoseEra: {}
				}
			}, unwrappedExpression.ConceptSets));
		};

		self.addPayerPlanPeriodCriteria = function() {
			var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					PayerPlanPeriod: {}
				}
			}, unwrappedExpression.ConceptSets));			
		};
		
		self.addProcedureCriteria = function () {
			var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					ProcedureOccurrence: {}
				}
			}, unwrappedExpression.ConceptSets));
		};

		self.addObservationCriteria = function () {
			var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					Observation: {}
				}
			}, unwrappedExpression.ConceptSets));
		};

		self.addVisitCriteria = function () {
			var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					VisitOccurrence: {}
				}
			}, unwrappedExpression.ConceptSets));
		};

		self.addDeviceCriteria = function () {
			var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					DeviceExposure: {}
				}
			}, unwrappedExpression.ConceptSets));
		};

		self.addMeasurementCriteria = function () {
			var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					Measurement: {}
				}
			}, unwrappedExpression.ConceptSets));
		};

		self.addSpecimenCriteria = function () {
			var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					Specimen: {}
				}
			}, unwrappedExpression.ConceptSets));
		};

		self.addObservationPeriodCriteria = function () {
			var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					ObservationPeriod: {}
				}
			}, unwrappedExpression.ConceptSets));
		};

		self.addDeathCriteria = function () {
			var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					Death: {}
				}
			}, unwrappedExpression.ConceptSets));
		}

		self.removeCriteria = function (observableList, data) {
			observableList.remove(data);
		};


		self.addEndWindow = function (corelatedCriteria) {
			corelatedCriteria.EndWindow(new Window());
		};

		self.removeEndWindow = function (corelatedCriteria) {
			corelatedCriteria.EndWindow(null);
		};

		self.addCriteriaSettings = {
			selectText: "Add New Criteria...",
			width: 250,
			height: 300,
			actionOptions: self.addCriteriaActions,
			onAction: function (data) {
				data.selectedData.action();
			}
		}

		// do not show restrict visit option for criteria where visit occurrence id is set to null
		self.hasVO = function (data) {
			switch (self.getCriteriaComponent(data)) {
				case "condition-era-criteria":
				case "death-criteria":
				case "drug-era-criteria":
				case "dose-era-criteria":
				case "observation-period-criteria":
				case "specimen-criteria":
					return false;
					break;
				default:
					return true;
			}
		}
	}

	// return compoonent definition
	return {
		viewModel: CriteriaGroupViewModel,
		template: template
	};
});
