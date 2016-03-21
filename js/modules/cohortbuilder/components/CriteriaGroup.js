define(['knockout', '../CriteriaTypes','../CriteriaGroup', '../AdditionalCriteria', '../options', 'text!./CriteriaGroupTemplate.html'], function (ko, criteriaTypes, CriteriaGroup, AdditionalCriteria, options, template) {

	function CriteriaGroupViewModel(params) {
		var self = this;

		var addCriteriaActions = [
			{
				text: "Add Condition Filters",
				selected: false,
				description: "Find patients with specific diagnoses.",
				//imageSrc: "images/cohortbuilder/condition.png",
				action: function () { self.addConditionCriteria(); }
			},
			{
				text: "Add Condition Era Filters",
				selected: false,
				description: "Find patients with specific diagnosis era.",
				//imageSrc: "images/cohortbuilder/condition.png",
				action: function () { self.addConditionEraCriteria(); }
			},
			{
				text: "Add Drug Filters",
				selected: false,
				description: "Find patients with exposure to specific drugs or drug classes.",
				//imageSrc: "images/cohortbuilder/drug.png",
				action: function () { self.addDrugExposureCriteria(); }
			},
			{
				text: "Add Drug Era Filters",
				selected: false,
				description: "Find patients with with exposure to drugs over time.",
				//imageSrc: "images/cohortbuilder/drugera.png",
				action: function () { self.addDrugEraCriteria(); }
			},
			{
				text: "Add Dose Era Filters",
				selected: false,
				description: "Find patients with dose eras.",
				//imageSrc: "images/cohortbuilder/drugera.png",
				action: function () { self.addDoseEraCriteria(); }
			},
			{
				text: "Add Procedure Filters",
				selected: false,
				description: "Find patients that experienced a specific procedure.",
				//imageSrc: "images/cohortbuilder/procedures.png",
				action: function () { self.addProcedureCriteria(); }
			},
			{
				text: "Add Observation Filters",
				selected: false,
				description: "Find patients based on lab tests or other observations.",
				//imageSrc: "images/cohortbuilder/observation.png",
				action: function () { self.addObservationCriteria(); }
			},
			{
				text: "Add Visit Filters",
				selected: false,
				description: "Find patients based on visit information.",
				//imageSrc: "images/cohortbuilder/visit.png",
				action: function () { self.addVisitCriteria(); }
			},
			{
				text: "Add Device Exposure Filters",
				selected: false,
				description: "Find patients based on device exposure.",
				//imageSrc: "images/cohortbuilder/procedures.png",
				action: function () { self.addDeviceCriteria(); }
			},
			{
				text: "Add Measurement Filters",
				selected: false,
				description: "Find patients based on Measurements.",
				//imageSrc: "images/cohortbuilder/procedures.png",
				action: function () { self.addMeasurementCriteria(); }
			},
			{
				text: "Add Specimen Filters",
				selected: false,
				description: "Find patients based on Specimen.",
				//imageSrc: "images/cohortbuilder/procedures.png",
				action: function () { self.addSpecimenCriteria(); }
			},			
			{
				text: "Add Observation Period Filters",
				selected: false,
				description: "Find patients based on Observation Period.",
				//imageSrc: "images/cohortbuilder/procedures.png",
				action: function () { self.addObservationPeriodCriteria(); }
			},
			{
				text: "Add Death Filters",
				selected: false,
				description: "Find patients based on death.",
				//imageSrc: "images/cohortbuilder/procedures.png",
				action: function () { self.addDeathCriteria(); }
			},
			{
				text: "Add Filter Group",
				selected: false,
				description: "Add a group to combine Filters.",
				//imageSrc: "images/cohortbuilder/group.png",
				action: function () { self.addAdditionalCriteria(); }
			}
		];

		self.expression = ko.utils.unwrapObservable(params.expression);
		self.group = params.group;
		self.parentGroup = params.parentGroup;
		self.options = options;
		self.groupCountOptions = ko.pureComputed(function() {
			var optionsArray = ['0'];
			for (var i=0;i < (self.group().CriteriaList().length + self.group().Groups().length); i++) {
				optionsArray.push(""+(i+1));
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
			self.group().Groups.push(new CriteriaGroup(null, self.expression.ConceptSets));
		};

		self.addConditionCriteria = function () {
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					ConditionOccurrence: {}
				}
			}, self.expression.ConceptSets));
		};

		self.addConditionEraCriteria = function () {
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					ConditionEra: {}
				}
			}, self.expression.ConceptSets));
		};

		self.addDrugExposureCriteria = function () {
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					DrugExposure: {}
				}
			}, self.expression.ConceptSets));
		};

		self.addDrugEraCriteria = function () {
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					DrugEra: {}
				}
			}, self.expression.ConceptSets));
		};

		self.addDoseEraCriteria = function () {
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					DoseEra: {}
				}
			}, self.expression.ConceptSets));
		};

		self.addProcedureCriteria = function () {
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					ProcedureOccurrence: {}
				}
			}, self.expression.ConceptSets));
		};
		
		self.addObservationCriteria = function () {
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					Observation: {}
				}
			}, self.expression.ConceptSets));
		};	

		self.addVisitCriteria = function () {
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					VisitOccurrence: {}
				}
			}, self.expression.ConceptSets));
		};
		
		self.addDeviceCriteria = function () {
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					DeviceExposure: {}
				}
			}, self.expression.ConceptSets));
		};
		
		self.addMeasurementCriteria = function () {
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					Measurement: {}
				}
			}, self.expression.ConceptSets));
		};

		self.addSpecimenCriteria = function () {
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					Specimen: {}
				}
			}, self.expression.ConceptSets));
		};
		
		self.addObservationPeriodCriteria = function () {
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					ObservationPeriod: {}
				}
			}, self.expression.ConceptSets));
		};		
		self.addDeathCriteria = function()
		{
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					Death: {}
				}
			}, self.expression.ConceptSets));
		}
		
		self.removeCriteria = function (observableList, data) {
			observableList.remove(data);
		};

		self.addCriteriaSettings = {
			selectText: "Add New Criteria...",
			width:250,
			height:300,
			actionOptions: addCriteriaActions,
			onAction: function (data) {
				data.selectedData.action();
			}
		}
	}

	// return compoonent definition
	return {
		viewModel: CriteriaGroupViewModel,
		template: template
	};
});