define(['knockout', 'jquery', '../options', '../CriteriaGroup', '../CriteriaTypes', '../CohortExpression', '../InclusionRule', 'text!./CohortExpressionEditorTemplate.html', './EndStrategyEditor',
	'databindings', 'conceptpicker/ConceptPicker', 'css!../css/builder.css', 'ko.sortable'
], function (ko, $, options, CriteriaGroup, criteriaTypes, CohortExpression, InclusionRule, template) {

	function CohortExpressionEditorViewModel(params) {
		var self = this;
		this.expressionMode = ko.observable('all');
		self.formatOption = function (d) {
			return '<div class="optionText">' + d.text + '</div>' +
				'<div class="optionDescription">' + d.description + '</div>';
		};

		self.primaryCriteriaOptions = [{
				text: "Add Condition Era Criteria",
				selected: false,
				description: "Find patients with specific diagosis era.",
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						ConditionEra: new criteriaTypes.ConditionEra(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Condition Occurrence Criteria",
				selected: false,
				description: "Find patients with specific diagnoses.",
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						ConditionOccurrence: new criteriaTypes.ConditionOccurrence(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Death Criteria",
				selected: false,
				description: "Find patients based on death.",
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						Death: new criteriaTypes.Death(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Device Exposure Criteria",
				selected: false,
				description: "Find patients based on device exposure.",
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						DeviceExposure: new criteriaTypes.DeviceExposure(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Dose Era Criteria",
				selected: false,
				description: "Find patients with dose eras.",
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						DoseEra: new criteriaTypes.DoseEra(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Drug Era Criteria",
				selected: false,
				description: "Find patients with with exposure to drugs over time.",
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						DrugEra: new criteriaTypes.DrugEra(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Drug Exposure Criteria",
				selected: false,
				description: "Find patients with exposure to specific drugs or drug classes.",
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						DrugExposure: new criteriaTypes.DrugExposure(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Measurement Criteria",
				selected: false,
				description: "Find patients based on Measurement.",
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						Measurement: new criteriaTypes.Measurement(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Observation Criteria",
				selected: false,
				description: "Find patients based on lab tests or other observations.",
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						Observation: new criteriaTypes.Observation(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Observation Period Criteria",
				selected: false,
				description: "Find patients based on Observation Period.",
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						ObservationPeriod: new criteriaTypes.ObservationPeriod(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Payer Plan Period Criteria",
				selected: false,
				description: "Find patients based on Payer Plan Period.",
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						PayerPlanPeriod: new criteriaTypes.PayerPlanPeriod(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Procedure Occurrence Criteria",
				selected: false,
				description: "Find patients that experienced a specific procedure.",
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						ProcedureOccurrence: new criteriaTypes.ProcedureOccurrence(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Specimen Criteria",
				selected: false,
				description: "Find patients based on Specimen.",
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						Specimen: new criteriaTypes.Specimen(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Visit Criteria",
				selected: false,
				description: "Find patients based on visit information.",
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						VisitOccurrence: new criteriaTypes.VisitOccurrence(null, self.expression().ConceptSets)
					});
				}
			}
		];

		self.censorCriteriaOptions = [{
				text: "Add Condition Era Criteria",
				selected: false,
				description: "Exit cohort based on diagosis era.",
				action: function () {
					self.expression().CensoringCriteria.push({
						ConditionEra: new criteriaTypes.ConditionEra(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Condition Occurrence Criteria",
				selected: false,
				description: "Exit cohort based on  diagnoses.",
				action: function () {
					self.expression().CensoringCriteria.push({
						ConditionOccurrence: new criteriaTypes.ConditionOccurrence(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Death Criteria",
				selected: false,
				description: "Exit cohort based on  death.",
				action: function () {
					self.expression().CensoringCriteria.push({
						Death: new criteriaTypes.Death(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Device Exposure Criteria",
				selected: false,
				description: "Exit cohort based on  device exposure.",
				action: function () {
					self.expression().CensoringCriteria.push({
						DeviceExposure: new criteriaTypes.DeviceExposure(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Dose Era Criteria",
				selected: false,
				description: "Exit cohort based on dose eras.",
				action: function () {
					self.expression().CensoringCriteria.push({
						DoseEra: new criteriaTypes.DoseEra(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Drug Era Criteria",
				selected: false,
				description: "Exit cohort based on drugs over time.",
				action: function () {
					self.expression().CensoringCriteria.push({
						DrugEra: new criteriaTypes.DrugEra(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Drug Exposure Criteria",
				selected: false,
				description: "Exit cohort based on exposure to specific drugs or drug classes.",
				action: function () {
					self.expression().CensoringCriteria.push({
						DrugExposure: new criteriaTypes.DrugExposure(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Measurement Criteria",
				selected: false,
				description: "Exit cohort based on Measurement.",
				action: function () {
					self.expression().CensoringCriteria.push({
						Measurement: new criteriaTypes.Measurement(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Observation Criteria",
				selected: false,
				description: "Exit cohort based on lab tests or other observations.",
				action: function () {
					self.expression().CensoringCriteria.push({
						Observation: new criteriaTypes.Observation(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Payer Plan Period Criteria",
				selected: false,
				description: "Find patients based on Payer Plan Period.",
				action: function () {
					self.expression().PrimaryCriteria().CriteriaList.push({
						PayerPlanPeriod: new criteriaTypes.PayerPlanPeriod(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Procedure Occurrence Criteria",
				selected: false,
				description: "Exit cohort based on procedures.",
				action: function () {
					self.expression().CensoringCriteria.push({
						ProcedureOccurrence: new criteriaTypes.ProcedureOccurrence(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Specimen Criteria",
				selected: false,
				description: "Find patients based on Specimen.",
				action: function () {
					self.expression().CensoringCriteria.push({
						Specimen: new criteriaTypes.Specimen(null, self.expression().ConceptSets)
					});
				}
			},
			{
				text: "Add Visit Criteria",
				selected: false,
				description: "Exit cohort based on visit information.",
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
