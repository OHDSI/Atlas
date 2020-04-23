define(['knockout', '../options', '../InputTypes/Range', '../utils', 'text!./DemographicCriteriaTemplate.html', '../const', './ConceptSetSelector'],
	function (ko, options, Range, utils, template, constants) {

	function DemographicCriteriaViewModel(params) {

		var self = this;
		self.Criteria = ko.utils.unwrapObservable(params.criteria);
		self.options = options;
		self.formatOption = utils.formatDropDownOption;
		self.addActions = [{
				text: constants.eventsList.addAgeCriteria.title(),
				selected: false,
				description: constants.eventsList.addAgeCriteria.desc(),
				action: function () {
					if (self.Criteria.Age() == null)
						self.Criteria.Age(new Range());
				}
			},
			{
				text: constants.eventsList.addGenderCriteria.title(),
				selected: false,
				description: constants.eventsList.addGenderCriteria.desc_second(),
				action: function () {
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());
				}
			},
			{
				text: constants.eventsList.addEventStartDateCriteria.title(),
				selected: false,
				description: constants.eventsList.addEventStartDateCriteria.desc(),
				action: function () {
					if (self.Criteria.OccurrenceStartDate() == null)
						self.Criteria.OccurrenceStartDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: constants.eventsList.addEventEndDateCriteria.title(),
				selected: false,
				description: constants.eventsList.addEventEndDateCriteria.desc(),
				action: function () {
					if (self.Criteria.OccurrenceEndDate() == null)
						self.Criteria.OccurrenceEndDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: constants.eventsList.addRaceCriteria.title(),
				selected: false,
				description: constants.eventsList.addRaceCriteria.desc(),
				action: function () {
					if (self.Criteria.Race() == null)
						self.Criteria.Race(ko.observableArray());
				}
			},
			{
				text: constants.eventsList.addEthnicityCriteria.title(),
				selected: false,
				description: constants.eventsList.addEthnicityCriteria.desc(),
				action: function () {
					if (self.Criteria.Ethnicity() == null)
						self.Criteria.Ethnicity(ko.observableArray());
				}
			}
		];

		self.removeCriterion = function (propertyName) {
			self.Criteria[propertyName](null);
		}

	}

	// return compoonent definition
	return {
		viewModel: DemographicCriteriaViewModel,
		template: template
	};
});
