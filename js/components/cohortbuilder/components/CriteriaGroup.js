define([
		'knockout',
		'../CriteriaTypes',
		'../CriteriaGroup',
		'../InputTypes/Window',
		'../AdditionalCriteria',
		'../options',
		'./utils',
		'./const',
		'text!./CriteriaGroupTemplate.html',
		'components/DropDownMenu'],
	function (ko, criteriaTypes, CriteriaGroup, Window, AdditionalCriteria, options, utils, consts, template) {

	function CriteriaGroupViewModel(params) {
		const self = this;
		self.formatOption = utils.formatDropDownOption;

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

		self.getCriteriaComponent = utils.getCriteriaComponent;

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

		self.addLocationRegionCriteria = function () {
			var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
			self.group().CriteriaList.push(new AdditionalCriteria({
				Criteria: {
					LocationRegion: {}
				},
				IgnoreObservationPeriod: true,
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
			corelatedCriteria.EndWindow(new Window({UseEventEnd:true}));
		};

		self.removeEndWindow = function (corelatedCriteria) {
			corelatedCriteria.EndWindow(null);
		};

		self.actions = {};

		self.actions[consts.CriteriaTypes.DEMOGRAPHIC] = self.addDemographicCriteria;
		self.actions[consts.CriteriaTypes.CONDITION_ERA] = self.addConditionEraCriteria;
		self.actions[consts.CriteriaTypes.CONDITION_OCCURRENCE] = self.addConditionCriteria;
		self.actions[consts.CriteriaTypes.DEATH] = self.addDeathCriteria;
		self.actions[consts.CriteriaTypes.DEVICE_EXPOSURE] = self.addDeviceCriteria;
		self.actions[consts.CriteriaTypes.DRUG_ERA] = self.addDrugEraCriteria;
		self.actions[consts.CriteriaTypes.DRUG_EXPOSURE] = self.addDrugExposureCriteria;
		self.actions[consts.CriteriaTypes.LOCATION_REGION] = self.addLocationRegionCriteria;
		self.actions[consts.CriteriaTypes.MEASUREMENT] = self.addMeasurementCriteria;
		self.actions[consts.CriteriaTypes.OBSERVATION] = self.addObservationCriteria;
		self.actions[consts.CriteriaTypes.OBSERVATION_PERIOD] = self.addObservationPeriodCriteria;
		self.actions[consts.CriteriaTypes.PAYER_PLAN_PERIOD] = self.addPayerPlanPeriodCriteria;
		self.actions[consts.CriteriaTypes.PROCEDURE_OCCURRENCE] = self.addProcedureCriteria;
		self.actions[consts.CriteriaTypes.SPECIMEN] = self.addSpecimenCriteria;
		self.actions[consts.CriteriaTypes.VISIT] = self.addVisitCriteria;
		self.actions[consts.CriteriaTypes.GROUP] = self.addAdditionalCriteria;

		self.addCriteriaActions = consts.AddCriteriaActions.map(a => ({...a, action: self.actions[a.type]}));

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
				case "location-region-criteria":
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
