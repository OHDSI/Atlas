define(['knockout', '../options', '../utils', '../InputTypes/Range', '../CriteriaGroup', 'text!./LocationRegionTemplate.html'], function (ko, options, utils, Range, CriteriaGroup, template) {

	function LocationRegionViewModel(params) {

		var self = this;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.LocationRegion;
		self.options = options;

		self.addActions = [
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.location-region.criteria.start-date.option.text', "Add Start Date Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.location-region.criteria.start-date.option.description', "Filter Locations by date when Person started living there"),
				action: function () {
					if (self.Criteria.StartDate() == null)
						self.Criteria.StartDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.location-region.criteria.end-date.option.text', "Add End Date Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.location-region.criteria.end-date.option.description', "Filter Locations by date when Person finished living there"),
				action: function () {
					if (self.Criteria.EndDate() == null)
						self.Criteria.EndDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: ko.i18n('cc.viewEdit.design.subgroups.add.location-region.criteria.correlated-criteria.option.text', "Add Nested Criteria..."),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.location-region.criteria.correlated-criteria.option.description', "Apply criteria using the location region as the index event"),
				action: function () {
					if (self.Criteria.CorrelatedCriteria() == null)
						self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
				}
			}
		];

		self.removeCriterion = function (propertyName) {
			self.Criteria[propertyName](null);
		}

		self.indexMessage = ko.i18nformat('cc.viewEdit.design.subgroups.add.location-region.criteria.index-data.text', 'The index date refers to the location region of <%= conceptSetName %>.',
			{
				conceptSetName: utils.getConceptSetName(
					self.Criteria.CodesetId,
					self.expression.ConceptSets,
					ko.i18n('cc.viewEdit.design.subgroups.add.location-region.criteria.default-concept-name', 'Any Region'))
			});

	}

	// return compoonent definition
	return {
		viewModel: LocationRegionViewModel,
		template: template
	};
});
