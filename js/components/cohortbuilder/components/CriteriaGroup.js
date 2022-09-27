define([
		'knockout',
		'../CriteriaTypes',
		'../CriteriaGroup',
		'../InputTypes/Window',
		'../AdditionalCriteria',
		'../options',
		'../utils',
		'../const',
		'text!./CriteriaGroupTemplate.html',
		'components/DropDownMenu',
		'components/from-reusables-modal/from-reusables-modal',
		'less!./CriteriaGroup.less'],
	function (ko, criteriaTypes, CriteriaGroup, Window, AdditionalCriteria, options, utils, constants, template) {

	function CriteriaGroupViewModel(params) {
		const self = this;
		self.formatOption = utils.formatDropDownOption;

		self.expression = params.expression;
		self.group = params.group;
		self.parentGroup = params.parentGroup;
		self.options = options;
		self.indexMessage = params.indexMessage;
		self.groupCountOptions = ko.pureComputed(function () {
			var optionsArray = ['0'];
			for (var i = 0; i < (self.group().CriteriaList().length + self.group().Groups().length); i++) {
				optionsArray.push("" + (i + 1));
			}
			return optionsArray;
		});

		self.getCriteriaComponent = utils.getCriteriaComponent;

		self.addActions = [
			{
				...constants.groupAttributes.addDemographic,
				selected: false,
				action: function () {
					self.group().DemographicCriteriaList.push(new criteriaTypes.DemographicCriteria());
				}
			},
			{
				...constants.groupAttributes.addConditionEra,
				selected: false,
				action: function () {
					var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
					self.group().CriteriaList.push(new AdditionalCriteria({
						Criteria: {
							ConditionEra: {}
						}
					}, unwrappedExpression.ConceptSets));
				},
			},
			{
				...constants.groupAttributes.addConditionOccurrence,
				selected: false,
				action: function () {
					var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
					self.group().CriteriaList.push(new AdditionalCriteria({
						Criteria: {
							ConditionOccurrence: {}
						}
					}, unwrappedExpression.ConceptSets));
				}
			},
			{
				...constants.groupAttributes.addDeath,
				selected: false,
				action: function () {
					var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
					self.group().CriteriaList.push(new AdditionalCriteria({
						Criteria: {
							Death: {}
						}
					}, unwrappedExpression.ConceptSets));
				}
			},
			{
				...constants.groupAttributes.addDeviceExposure,
				selected: false,
				action: function () {
					var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
					self.group().CriteriaList.push(new AdditionalCriteria({
						Criteria: {
							DeviceExposure: {}
						}
					}, unwrappedExpression.ConceptSets));
				}
			},
			{
				...constants.groupAttributes.addDoseEra,
				selected: false,
				action: function () {
					var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
					self.group().CriteriaList.push(new AdditionalCriteria({
						Criteria: {
							DoseEra: {}
						}
					}, unwrappedExpression.ConceptSets));
				}
			},
			{
				...constants.groupAttributes.addDrugEra,
				selected: false,
				action: function () {
					var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
					self.group().CriteriaList.push(new AdditionalCriteria({
						Criteria: {
							DrugEra: {}
						}
					}, unwrappedExpression.ConceptSets));
				}
			},
			{
				...constants.groupAttributes.addDrugExposure,
				selected: false,
				action: function () {
					var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
					self.group().CriteriaList.push(new AdditionalCriteria({
						Criteria: {
							DrugExposure: {}
						}
					}, unwrappedExpression.ConceptSets));
				}
			},
			{
				...constants.groupAttributes.addLocationRegion,
				selected: false,
				action: function () {
					var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
					self.group().CriteriaList.push(new AdditionalCriteria({
						Criteria: {
							LocationRegion: {}
						},
						IgnoreObservationPeriod: true,
					}, unwrappedExpression.ConceptSets));
				}
			},
			{
				...constants.groupAttributes.addMeasurement,
				selected: false,
				action: function () {
					var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
					self.group().CriteriaList.push(new AdditionalCriteria({
						Criteria: {
							Measurement: {}
						}
					}, unwrappedExpression.ConceptSets));
				}
			},
			{
				...constants.groupAttributes.addObservation,
				selected: false,
				action: function () {
					var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
					self.group().CriteriaList.push(new AdditionalCriteria({
						Criteria: {
							Observation: {}
						}
					}, unwrappedExpression.ConceptSets));
				}
			},
			{
				...constants.groupAttributes.addObservationPeriod,
				selected: false,
				action: function () {
					var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
					self.group().CriteriaList.push(new AdditionalCriteria({
						Criteria: {
							ObservationPeriod: {}
						}
					}, unwrappedExpression.ConceptSets));
				}
			},
			{
				...constants.groupAttributes.addPayerPlanPeriod,
				selected: false,
				action: function () {
					var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
					self.group().CriteriaList.push(new AdditionalCriteria({
						Criteria: {
							PayerPlanPeriod: {}
						}
					}, unwrappedExpression.ConceptSets));
				}
			},
			{
				...constants.groupAttributes.addProcedureOccurrence,
				selected: false,
				action: function () {
					var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
					self.group().CriteriaList.push(new AdditionalCriteria({
						Criteria: {
							ProcedureOccurrence: {}
						}
					}, unwrappedExpression.ConceptSets));
				}
			},
			{
				...constants.groupAttributes.addSpecimen,
				selected: false,
				action: function () {
					var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
					self.group().CriteriaList.push(new AdditionalCriteria({
						Criteria: {
							Specimen: {}
						}
					}, unwrappedExpression.ConceptSets));
				}
			},
			{
				...constants.groupAttributes.addVisit,
				selected: false,
				action: function () {
					var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
					self.group().CriteriaList.push(new AdditionalCriteria({
						Criteria: {
							VisitOccurrence: {}
						}
					}, unwrappedExpression.ConceptSets));
				}
			},
			{
				...constants.groupAttributes.addVisitDetail,
				selected: false,
				action: function () {
					var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
					self.group().CriteriaList.push(new AdditionalCriteria({
						Criteria: {
							VisitDetail: {}
						}
					}, unwrappedExpression.ConceptSets));
				}
			},
			{
				...constants.groupAttributes.addGroup,
				selected: false,
				action: function () {
					var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
					self.group().Groups.push(new CriteriaGroup(null, unwrappedExpression.ConceptSets));
				}
			},
			{
				...constants.groupAttributes.fromReusable,
				selected: false,
				action: function () {
					self.showReusablesModal(true);
				}
			},
		];

		self.removeCriteria = function (observableList, data) {
			observableList.remove(data);
		};

		self.addEndWindow = function (corelatedCriteria) {
			corelatedCriteria.EndWindow(new Window({UseEventEnd:true}));
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
				case "location-region-criteria":
					return false;
					break;
				default:
					return true;
			}
		}

		self.getDistinctOptions = function (criteria) {
			let distinctOptions = [{id: "DOMAIN_CONCEPT", name: "Standard Concept"}, {id: "START_DATE", name: "Start Date"}];
			if (self.hasVO(criteria)) {
				distinctOptions.push({id: "VISIT_ID", name: "Visit"});
			}
			return distinctOptions;
		}

		self.showReusablesModal = ko.observable(false);
		self.insertFromReusable = (expression, conceptSets) => {
			if (conceptSets.length > 0) {
				const unwrappedExpression = ko.utils.unwrapObservable(self.expression);
				unwrappedExpression.ConceptSets(unwrappedExpression.ConceptSets().concat(conceptSets));
			}

			self.group().Type(expression.Type());
			ko.utils.arrayForEach(expression.CriteriaList(), c => {
				self.group().CriteriaList.push(c);
			});
			ko.utils.arrayForEach(expression.DemographicCriteriaList(), c => {
				self.group().DemographicCriteriaList.push(c);
			});
			ko.utils.arrayForEach(expression.Groups(), g => {
				self.group().Groups.push(g);
			});
		};
	}

	// return compoonent definition
	return {
		viewModel: CriteriaGroupViewModel,
		template: template
	};
});
