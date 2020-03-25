define(['knockout', '../options', '../utils', '../InputTypes/Range', '../InputTypes/Text', '../CriteriaGroup', 'text!./ConditionOccurrenceTemplate.html', './ConceptSetSelector'], function (ko, options, utils, Range, Text, CriteriaGroup, template) {

	function ConditionOccurrenceViewModel(params) {

		var self = this;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.ConditionOccurrence;
		self.options = options;

		self.formatOption = function (d) {
			return '<div class="optionText">' + d.text + '</div>' +
				'<div class="optionDescription">' + d.description + '</div>';
		};

		self.addActions = [{
			    text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.first-diagnosis.option.text', "Add First Diagnosis"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.first-diagnosis.option.description', "Limit Condition Occurrences to new diagnosis."),
				action: function () {
					if (self.Criteria.First() == null)
						self.Criteria.First(true);
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.age-at-occurrence.option.text', "Add Age at Occurrence"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.age-at-occurrence.option.description', "Filter Condition Occurrences by age at occurrence."),
				action: function () {
					if (self.Criteria.Age() == null)
						self.Criteria.Age(new Range());
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.gender.option.text', "Add Gender"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.gender.option.description', "Filter Condition Occurrences based on Gender."),
				action: function () {
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());
				}

			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.condition-start-date.option.text', "Add Condition Start Date"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.condition-start-date.option.description', "Filter Condition Occurrences by the Condition Start Date."),
				action: function () {
					if (self.Criteria.OccurrenceStartDate() == null)
						self.Criteria.OccurrenceStartDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.condition-end-date.option.text', "Add Condition End Date"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.condition-end-date.option.description', "Filter Condition Occurrences  by the Condition End Date"),
				action: function () {
					if (self.Criteria.OccurrenceEndDate() == null)
						self.Criteria.OccurrenceEndDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.condition-type.option.text', "Add Condition Type"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.condition-type.option.description', "Filter Condition Occurrences  by the Condition Type."),
				action: function () {
					if (self.Criteria.ConditionType() == null)
						self.Criteria.ConditionType(ko.observableArray());
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.visit.option.text', "Add Visit"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.visit.option.description', "Filter Condition Occurrences based on visit occurrence of diagnosis."),
				action: function () {
					if (self.Criteria.VisitType() == null)
						self.Criteria.VisitType(ko.observableArray());
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.stop-reason.option.text', "Add Stop Reason"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.stop-reason.option.description', "Filter Condition Occurrences  by the Stop Reason."),
				action: function () {
					if (self.Criteria.StopReason() == null)
						self.Criteria.StopReason(new Text({
							Op: "contains"
						}));
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.condition-source-concept.option.text', "Add Condition Source Concept"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.condition-source-concept.option.description', "Filter Condition Occurrences  by the Condition Source Concept."),
				action: function () {
					if (self.Criteria.ConditionSourceConcept() == null)
						self.Criteria.ConditionSourceConcept(ko.observable());
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.provider-specialty.option.text', "Add Provider Specialty"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.provider-specialty.option.description', "Filter Condition Occurrences based on provider specialty."),
				action: function () {
					if (self.Criteria.ProviderSpecialty() == null)
						self.Criteria.ProviderSpecialty(ko.observableArray());
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.nested-criteria.option.text', "Add Nested Criteria..."),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.nested-criteria.option.description', "Apply criteria using the condition occurrence as the index event"),
				action: function () {
					if (self.Criteria.CorrelatedCriteria() == null)
						self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
				}
			}
		];

		self.removeCriterion = function (propertyName) {
			self.Criteria[propertyName](null);
		}


		self.indexMessage = ko.i18nformat('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.index-data.text', 'The index date refers to the condition occurrence of <%= conceptSetName %>.',
			{conceptSetName: utils.getConceptSetName(
					self.Criteria.CodesetId,
					self.expression.ConceptSets,
					ko.i18n('cc.viewEdit.design.subgroups.add.condition-occurrence.criteria.index-data.default-name', 'Any Condition'))
			});

	}

	// return compoonent definition
	return {
		viewModel: ConditionOccurrenceViewModel,
		template: template
	};
});
