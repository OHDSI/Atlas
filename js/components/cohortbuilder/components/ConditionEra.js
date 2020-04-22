define(['knockout', '../options', '../utils', '../InputTypes/Range', '../CriteriaGroup', 'text!./ConditionEraTemplate.html', '../const'], 
function (ko, options, utils, Range, CriteriaGroup, template, constants) {

	function ConditionEraViewModel(params) {

		var self = this;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.ConditionEra;
		self.options = options;

		self.formatOption = function (d) {
			return '<div class="optionText">' + d.text + '</div>' +
				'<div class="optionDescription">' + d.description + '</div>';
		};

		self.addActions = [{
				text: constants.eventsList.addFirstDiagnosisCriteria.title(),
				selected: false,
				description: constants.eventsList.addFirstDiagnosisCriteria.desc(),
				action: function () {
					if (self.Criteria.First() == null)
						self.Criteria.First(true);
				}
			},
			{
				text: constants.eventsList.addAgeAtEraStartCriteria.title(),
				selected: false,
				description: constants.eventsList.addAgeAtEraStartCriteria.desc(),
				action: function () {
					if (self.Criteria.AgeAtStart() == null)
						self.Criteria.AgeAtStart(new Range());
				}
			},
			{
				text: constants.eventsList.addAgeAtEraEndCriteria.title(),
				selected: false,
				description: constants.eventsList.addAgeAtEraEndCriteria.desc(),
				action: function () {
					if (self.Criteria.AgeAtEnd() == null)
						self.Criteria.AgeAtEnd(new Range());
				}
			},
			{
				text: constants.eventsList.addGenderCriteria.title(),
				selected: false,
				description: constants.eventsList.addGenderCriteria.desc(),
				action: function () {
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());
				}
			},
			{
				text: constants.eventsList.addStartDateCriteria.title(),
				selected: false,
				description: constants.eventsList.addStartDateCriteria.desc(),
				action: function () {
					if (self.Criteria.EraStartDate() == null)
						self.Criteria.EraStartDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: constants.eventsList.addEndDateCriteria.title(),
				selected: false,
				description: constants.eventsList.addEndDateCriteria.desc(),
				action: function () {
					if (self.Criteria.EraEndDate() == null)
						self.Criteria.EraEndDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: constants.eventsList.addEraConditonCountCriteria.title(),
				selected: false,
				description: constants.eventsList.addEraConditonCountCriteria.desc(),
				action: function () {
					if (self.Criteria.OccurrenceCount() == null)
						self.Criteria.OccurrenceCount(new Range());
				}
			},
			{
				text: constants.eventsList.addEraLengthCriteria.title(),
				selected: false,
				description: constants.eventsList.addEraLengthCriteria.desc(),
				action: function () {
					if (self.Criteria.EraLength() == null)
						self.Criteria.EraLength(new Range());
				}
			},
			{
				text: constants.eventsList.addNestedCriteria.title(),
				selected: false,
				description: constants.eventsList.addNestedCriteria.desc(),
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
			var anyCondition = ko.i18n('components.conditionEra.anyConditionButton', 'Any Condition');
			var message = ko.i18n('components.conditionEra.returnText_1', 'The index date refers to the condition era of')
			var conceptSetName = utils.getConceptSetName(self.Criteria.CodesetId, self.expression.ConceptSets, anyCondition());
			return `${message()} ${conceptSetName}.`;
		});
		
	}

	// return compoonent definition
	return {
		viewModel: ConditionEraViewModel,
		template: template
	};
});
