define(['knockout', '../options', '../utils', '../InputTypes/Range', '../CriteriaGroup', 'text!./ConditionEraTemplate.html'], function (ko, options, utils, Range, CriteriaGroup, template) {

	function ConditionEraViewModel(params) {

		var self = this;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.ConditionEra;
		self.options = options;

		self.addActions = [{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.first-diagnosis.option.text', "Add First Diagnosis Criteria"),
				selected: false,
			    description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.first-diagnosis.option.description', "Limit Condition Eras to first diagnosis era in history."),
				action: function () {
					if (self.Criteria.First() == null)
						self.Criteria.First(true);
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.age-at-era-start.option.text', "Add Age at Era Start Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.age-at-era-start.option.description', "Filter Condition Eras by age at era start."),
				action: function () {
					if (self.Criteria.AgeAtStart() == null)
						self.Criteria.AgeAtStart(new Range());
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.age-at-era-end.option.text', "Add Age at Era End Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.age-at-era-end.option.description', "Filter Condition Eras by age at era end."),
				action: function () {
					if (self.Criteria.AgeAtEnd() == null)
						self.Criteria.AgeAtEnd(new Range());
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.gender.option.text', "Add Gender Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.gender.option.description', "Filter Condition Eras based on Gender."),
				action: function () {
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.start-date.option.text', "Add Start Date Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.start-date.option.description', "Filter Condition Eras by the Era Start Date."),
				action: function () {
					if (self.Criteria.EraStartDate() == null)
						self.Criteria.EraStartDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.end-date.option.text', "Add End Date Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.end-date.option.description', "Filter Condition Eras  by the Era End Date"),
				action: function () {
					if (self.Criteria.EraEndDate() == null)
						self.Criteria.EraEndDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.era-condition-count.option.text', "Add Era Conditon Count Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.era-condition-count.option.description', "Filter Condition Eras by the Condition Count."),
				action: function () {
					if (self.Criteria.OccurrenceCount() == null)
						self.Criteria.OccurrenceCount(new Range());
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.era-length.option.text', "Add Era Length Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.era-length.option.description', "Filter Condition Eras by the Era duration."),
				action: function () {
					if (self.Criteria.EraLength() == null)
						self.Criteria.EraLength(new Range());
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.nested-criteria.option.text', "Add Nested Criteria..."),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.nested-criteria.option.description', "Apply criteria using the condition era as the index event..."),
				action: function () {
					if (self.Criteria.CorrelatedCriteria() == null)
						self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
				}
			}
		];

		self.removeCriterion = function (propertyName) {
			self.Criteria[propertyName](null);
		}

		self.indexMessage = ko.i18nformat('cc.viewEdit.design.subgroups.add.condition-era.criteria.index-data.text', 'The index date refers to the condition era of <%= conceptSetName %>.',
			{conceptSetName: utils.getConceptSetName(
					self.Criteria.CodesetId,
					self.expression.ConceptSets,
					ko.i18n('cc.viewEdit.design.subgroups.add.condition-era.criteria.index-data.default-name', 'Any Condition'))
			});
	}

	// return compoonent definition
	return {
		viewModel: ConditionEraViewModel,
		template: template
	};
});
