define(['knockout', '../options', '../InputTypes/Range', '../InputTypes/Text', '../CriteriaGroup', 'text!./SpecimenTemplate.html'], function (ko, options, Range, Text, CriteriaGroup, template) {

	function SpecimenViewModel(params) {
		var self = this;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.Specimen;
		self.options = options;
		self.formatOption = function (d) {
			return '<div class="optionText">' + d.text + '</div>' +
				'<div class="optionDescription">' + d.description + '</div>';
		};
		self.addActions = [{
				text: "Add First Occurrence Criteria",
				selected: false,
				description: "Limit Specimen to the first occurrence in history.",
				action: function () {
					if (self.Criteria.First() == null)
						self.Criteria.First(true);
				}
			},
			{
				text: "Add Age at Occurrence Criteria",
				selected: false,
				description: "Filter specimens by age at occurrence.",
				action: function () {
					if (self.Criteria.Age() == null)
						self.Criteria.Age(new Range());
				}
			},
			{
				text: "Add Gender Criteria",
				selected: false,
				description: "Filter specimens based on Gender.",
				action: function () {
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());
				}
			},
			{
				text: "Add Specimen Date Criteria",
				selected: false,
				description: "Filter Specimen by Date.",
				action: function () {
					if (self.Criteria.OccurrenceStartDate() == null)
						self.Criteria.OccurrenceStartDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: "Add Specimen Type Criteria",
				selected: false,
				description: "Filter Specimen by the Type.",
				action: function () {
					if (self.Criteria.SpecimenType() == null)
						self.Criteria.SpecimenType(ko.observableArray());
				}
			},
			{
				text: "Add Quantity Criteria",
				selected: false,
				description: "Filter Observations  by the Quantity.",
				action: function () {
					if (self.Criteria.Quantity() == null)
						self.Criteria.Quantity(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: "Add Unit Criteria",
				selected: false,
				description: "Filter Specimens by Unit.",
				action: function () {
					if (self.Criteria.Unit() == null)
						self.Criteria.Unit(ko.observableArray());
				}
			},
			{
				text: "Add Anatomic Site Criteria",
				selected: false,
				description: "Filter Specimens by the Anatomic Site.",
				action: function () {
					if (self.Criteria.AnatomicSite() == null)
						self.Criteria.AnatomicSite(ko.observableArray());
				}
			},
			{
				text: "Add Disease Status Criteria",
				selected: false,
				description: "Filter Specimens by the Disease Status.",
				action: function () {
					if (self.Criteria.DiseaseStatus() == null)
						self.Criteria.DiseaseStatus(ko.observableArray());
				}
			},
			{
				text: "Add Source ID Criteria",
				selected: false,
				description: "Filter Specimens by the Source ID.",
				action: function () {
					if (self.Criteria.SourceId() == null)
						self.Criteria.SourceId(new Text({
							Op: "contains"
						}));
				}
			},
			{
				text: "Add Nested Criteria...",
				selected: false,
				description: "Apply criteria using the condition occurrence as the index date",
				action: function () {
					if (self.Criteria.CorrelatedCriteria() == null)
						self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
				}
			}
		];

		self.addCriterionSettings = {
			selectText: "Add criteria attribute…",
			height: 300,
			actionOptions: self.addActions,
			onAction: function (data) {
				data.selectedData.action();
			}
		};

		self.removeCriterion = function (propertyName) {
			self.Criteria[propertyName](null);
		}
	}

	// return compoonent definition
	return {
		viewModel: SpecimenViewModel,
		template: template
	};
});
