define(['knockout', 'jquery', '../options', '../CriteriaGroup', '../CriteriaTypes', '../CohortExpression', '../InclusionRule', 'text!./CohortExpressionEditorTemplate.html', '../const', './EndStrategyEditor',
	'databindings', 'conceptpicker/ConceptPicker', 'css!../css/builder.css', 'ko.sortable', 'less!./CohortExpressionEditor.less'
], function (ko, $, options, CriteriaGroup, criteriaTypes, CohortExpression, InclusionRule, template, constants) {

	function CohortExpressionEditorViewModel(params) {
		var self = this;
		this.expressionMode = ko.observable('all');
		self.formatOption = function (d) {
			return '<div class="optionText">' + d.text + '</div>' +
				'<div class="optionDescription">' + d.description + '</div>';
		};
		self.helpCohortEventsOpened = ko.observable(false);
		self.helpInclusionCriteriaOpened = ko.observable(false);
		self.helpCohortExitOpened = ko.observable(false);
		self.primaryCriteriaOptions = [{
				text: constants.eventsList.addConditionEra.title(),
				selected: false,
				description: constants.eventsList.addConditionEra.desc(),
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						ConditionEra: new criteriaTypes.ConditionEra(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addConditionOccurrence.title(),
				selected: false,
				description: constants.eventsList.addConditionOccurrence.desc(),
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						ConditionOccurrence: new criteriaTypes.ConditionOccurrence(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addDeath.title(),
				selected: false,
				description: constants.eventsList.addDeath.desc(),
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						Death: new criteriaTypes.Death(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addDeviceExposure.title(),
				selected: false,
				description: constants.eventsList.addDeviceExposure.desc(),
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						DeviceExposure: new criteriaTypes.DeviceExposure(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addDoseEra.title(),
				selected: false,
				description: constants.eventsList.addDoseEra.desc(),
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						DoseEra: new criteriaTypes.DoseEra(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addDrugEra.title(),
				selected: false,
				description: constants.eventsList.addDrugEra.desc(),
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						DrugEra: new criteriaTypes.DrugEra(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addDrugExposure.title(),
				selected: false,
				description: constants.eventsList.addDrugExposure.desc(),
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						DrugExposure: new criteriaTypes.DrugExposure(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addMeasurement.title(),
				selected: false,
				description: constants.eventsList.addMeasurement.desc(),
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						Measurement: new criteriaTypes.Measurement(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addObservation.title(),
				selected: false,
				description: constants.eventsList.addObservation.desc(),
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						Observation: new criteriaTypes.Observation(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addObservationPeriod.title(),
				selected: false,
				description: constants.eventsList.addObservationPeriod.desc(),
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						ObservationPeriod: new criteriaTypes.ObservationPeriod(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addPayerPlanPeriod.title(),
				selected: false,
				description: constants.eventsList.addPayerPlanPeriod.desc(),
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						PayerPlanPeriod: new criteriaTypes.PayerPlanPeriod(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addProcedureOccurrence.title(),
				selected: false,
				description: constants.eventsList.addProcedureOccurrence.desc(),
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						ProcedureOccurrence: new criteriaTypes.ProcedureOccurrence(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addSpecimen.title(),
				selected: false,
				description: constants.eventsList.addSpecimen.desc(),
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						Specimen: new criteriaTypes.Specimen(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addVisit.title(),
				selected: false,
				description: constants.eventsList.addVisit.desc(),
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						VisitOccurrence: new criteriaTypes.VisitOccurrence(null, self.expression().ConceptSets)
					});
				}
			}
		];

		self.censorCriteriaOptions = [{
				text: constants.eventsList.addConditionEra.title(),
				selected: false,
				description: constants.eventsList.addConditionEra.desc_second(),
				action: function () {
					self.expression().CensoringCriteria.push({
						ConditionEra: new criteriaTypes.ConditionEra(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addConditionOccurrence.title(),
				selected: false,
				description: constants.eventsList.addConditionOccurrence.desc_second(),
				action: function () {
					self.expression().CensoringCriteria.push({
						ConditionOccurrence: new criteriaTypes.ConditionOccurrence(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addDeath.title(),
				selected: false,
				description: constants.eventsList.addDeath.desc_second(),
				action: function () {
					self.expression().CensoringCriteria.push({
						Death: new criteriaTypes.Death(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addDeviceExposure.title(),
				selected: false,
				description: constants.eventsList.addDeviceExposure.desc_second(),
				action: function () {
					self.expression().CensoringCriteria.push({
						DeviceExposure: new criteriaTypes.DeviceExposure(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addDoseEra.title(),
				selected: false,
				description: constants.eventsList.addDoseEra.desc_second(),
				action: function () {
					self.expression().CensoringCriteria.push({
						DoseEra: new criteriaTypes.DoseEra(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addDrugEra.title(),
				selected: false,
				description: constants.eventsList.addDrugEra.desc_second(),
				action: function () {
					self.expression().CensoringCriteria.push({
						DrugEra: new criteriaTypes.DrugEra(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addDrugExposure.title(),
				selected: false,
				description: constants.eventsList.addDrugExposure.desc_second(),
				action: function () {
					self.expression().CensoringCriteria.push({
						DrugExposure: new criteriaTypes.DrugExposure(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addMeasurement.title(),
				selected: false,
				description: constants.eventsList.addMeasurement.desc_second(),
				action: function () {
					self.expression().CensoringCriteria.push({
						Measurement: new criteriaTypes.Measurement(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addObservation.title(),
				selected: false,
				description: constants.eventsList.addObservation.desc_second(),
				action: function () {
					self.expression().CensoringCriteria.push({
						Observation: new criteriaTypes.Observation(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addPayerPlanPeriod.title(),
				selected: false,
				description: constants.eventsList.addPayerPlanPeriod.desc_second(),
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						PayerPlanPeriod: new criteriaTypes.PayerPlanPeriod(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addProcedureOccurrence.title(),
				selected: false,
				description: constants.eventsList.addProcedureOccurrence.desc_second(),
				action: function () {
					self.expression().CensoringCriteria.push({
						ProcedureOccurrence: new criteriaTypes.ProcedureOccurrence(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addVisit.title(),
				selected: false,
				description: constants.eventsList.addVisit.desc_second(),
				action: function () {
					self.expression().CensoringCriteria.push({
						Specimen: new criteriaTypes.Specimen(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: constants.eventsList.addDeviceExposure.title(),
				selected: false,
				description: constants.eventsList.addDeviceExposure.desc_second(),
				action: function () {
					self.expression().CensoringCriteria.push({
						VisitOccurrence: new criteriaTypes.VisitOccurrence(null, self.expression().ConceptSets)
					});
				}
			}
		];

		if (params.widget) {
			params.widget(this);
		}

		self.expression = params.expression;
		self.options = options;

		self.showCensorWindow = ko.observable(self.expression().CensorWindow().StartDate() || self.expression().CensorWindow().EndDate());
		self.selectedInclusionRule = ko.observable(null);
		self.selectedInclusionRuleIndex = null;

		self.selectInclusionRule = function (inclusionRule) {
			self.selectedInclusionRule(inclusionRule);
			self.selectedInclusionRuleIndex = params.expression().InclusionRules().indexOf(inclusionRule);
		};

		self.removeAdditionalCriteria = function () {
			self.expression().AdditionalCriteria(null);
		};

		self.addAdditionalCriteria = function () {
			self.expression().AdditionalCriteria(new CriteriaGroup(null, self.expression().ConceptSets));
		};

		self.removePrimaryCriteria = function (criteria) {
			self.expression().PrimaryCriteria().CriteriaList.remove(criteria);
		};

		self.removeCensoringCriteria = function (criteria) {
			self.expression().CensoringCriteria.remove(criteria);
		};

		self.addInclusionRule = function () {
			var newInclusionRule = new InclusionRule(null, self.expression().ConceptSets);
			self.expression().InclusionRules.push(newInclusionRule);
			self.selectInclusionRule(newInclusionRule);
		};

		self.deleteInclusionRule = function (inclusionRule) {
			self.selectedInclusionRule(null);
			self.expression().InclusionRules.remove(inclusionRule);
		};

		self.copyInclusionRule = function (inclusionRule) {
			var copiedRule = new InclusionRule(ko.toJS(inclusionRule), self.expression().ConceptSets);
			copiedRule.name("Copy of: " + copiedRule.name());
			self.expression().InclusionRules.push(copiedRule);
			self.selectedInclusionRule(copiedRule);
		};

		self.addPrimaryCriteriaOptions = {
			selectText: "Add Initial Event...",
			width: 250,
			height: 300,
			actionOptions: self.primaryCriteriaOptions,
			onAction: function (data) {
				data.selectedData.action();
			}
		};

		self.addCensorCriteriaOptions = {
			selectText: "Add Censoring Event...",
			width: 250,
			height: 300,
			actionOptions: self.censorCriteriaOptions,
			onAction: function (data) {
				data.selectedData.action();
			}
		};


		self.getCriteriaIndexComponent = function (data) {
			data = ko.utils.unwrapObservable(data);

			if (data.hasOwnProperty("ConditionOccurrence"))
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
			else if (data.hasOwnProperty("Observation"))
				return "observation-criteria";
			else if (data.hasOwnProperty("VisitOccurrence"))
				return "visit-occurrence-criteria";
			else if (data.hasOwnProperty("DeviceExposure"))
				return "device-exposure-criteria";
			else if (data.hasOwnProperty("Measurement"))
				return "measurement-criteria";
			else if (data.hasOwnProperty("Specimen"))
				return "specimen-criteria";
			else if (data.hasOwnProperty("ObservationPeriod"))
				return "observation-period-criteria";
			else if (data.hasOwnProperty("PayerPlanPeriod"))
				return "payer-plan-period-criteria";
			else if (data.hasOwnProperty("Death"))
				return "death-criteria";
			else if (data.hasOwnProperty("LocationRegion"))
				return "location-region-criteria";
			else
				return "unknownCriteriaType";
		};

		self.getExpressionJSON = function () {
			return ko.toJSON(self.expression(), function (key, value) {
				if (value === 0 || value) {
					return value;
				} else {
					return;
				}
			}, 2);
		};
		
		self.inclusionRuleNavMinHeight = function() {
			return Math.max(75, Math.min(550, self.expression().InclusionRules().length * 40) ) + "px";
		}

		// Subscriptions

		self.expressionSubscription = self.expression.subscribe(function (newVal) {
			console.log("New Cohort Expression set.");
			self.selectedInclusionRule(params.expression().InclusionRules()[self.selectedInclusionRuleIndex]);
		});

		// Cleanup

		self.dispose = function () {
			console.log("Cohort Expression Editor Dispose.");
			self.expressionSubscription.dispose();
		};



	}

	// return factory
	return {
		viewModel: CohortExpressionEditorViewModel,
		template: template
	};
});
