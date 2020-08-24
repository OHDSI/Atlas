define(['knockout', '../options', '../utils', '../InputTypes/Range', '../CriteriaGroup', 'text!./LocationRegionTemplate.html'], function (ko, options, utils, Range, CriteriaGroup, template) {

	function LocationRegionViewModel(params) {

		var self = this;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.LocationRegion;
		self.options = options;

		self.formatOption = function (d) {
			return '<div class="optionText">' + d.text + '</div>' +
				'<div class="optionDescription">' + d.description + '</div>';
		};

		self.addActions = [
			{
				text: "Add Start Date Criteria",
				selected: false,
				description: "Filter Locations by date when Person started living there.",
				action: function () {
					if (self.Criteria.StartDate() == null)
						self.Criteria.StartDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: "Add End Date Criteria",
				selected: false,
				description: "Filter Locations by date when Person finished living there.",
				action: function () {
					if (self.Criteria.EndDate() == null)
						self.Criteria.EndDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: "Add Nested Criteria...",
				selected: false,
				description: "Apply criteria using the location region as the index event.",
				action: function () {
					if (self.Criteria.CorrelatedCriteria() == null)
						self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
				}
			}
		];

		self.removeCriterion = function (propertyName) {
			self.Criteria[propertyName](null);
		}
		
		self.indexMessage = ko.pureComputed(() => {
			var conceptSetName = utils.getConceptSetName(self.Criteria.CodesetId, self.expression.ConceptSets, 'Any Region');
			return `The index date refers to the location region of ${conceptSetName}.`;
		});		
	}

	// return compoonent definition
	return {
		viewModel: LocationRegionViewModel,
		template: template
	};
});
