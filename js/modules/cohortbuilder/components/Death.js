define(['knockout', '../options', '../InputTypes/Range', '../InputTypes/Text', '../CriteriaGroup', 'text!./DeathTemplate.html'], function (ko, options, Range, Text, CriteriaGroup, template) {

	function DeathViewModel(params) {
		var self = this;

		self.formatOption = function (d) {
			return '<div class="optionText">' + d.text + '</div>' +
				'<div class="optionDescription">' + d.description + '</div>';
		};

		self.addActions = [{
				text: "Add Age at Occurrence Criteria",
				value: 3,
				selected: false,
				description: "Filter by age at death."
			},
			{
				text: "Add Gender Criteria",
				value: 4,
				selected: false,
				description: "Filter Deaths based on Gender."
			},
			{
				text: "Add Death Date Criteria",
				value: 0,
				selected: false,
				description: "Filter Death by Date."
			},
			{
				text: "Add Death Type Criteria",
				value: 1,
				selected: false,
				description: "Filter by Death Type."
			},
			{
				text: "Add Cause of Death Source Concept Criteria",
				value: 2,
				selected: false,
				description: "Filter Death by the Death Source Concept."
			},
			{
				text: "Add Nested Criteria...",
				value: 11,
				selected: false,
				description: "Apply criteria using the condition occurrence as the index date",
			}
			/*
			 			{
							text: "Add Prior Observation Duration Criteria",
							value: 8,
							selected: false,
							description: "Filter Condition Occurrences based on Prior Observation Duration."
								},
						{
							text: "Add Post Observation Duration Criteria",
							value: 9,
							selected: false,
							description: "Filter Condition Occurrences based on Prior Observation Duration."
								}
			*/
		];

		self.actionHandler = function (data) {
			var criteriaType = data.value;
			switch (criteriaType) {
				case 0:
					if (self.Criteria.OccurrenceStartDate() == null)
						self.Criteria.OccurrenceStartDate(new Range({
							Op: "lt"
						}));
					break;
				case 1:
					if (self.Criteria.DeathType() == null)
						self.Criteria.DeathType(ko.observableArray());
					break;
				case 2:
					if (self.Criteria.DeathSourceConcept() == null)
						self.Criteria.DeathSourceConcept(ko.observable());
					break;
				case 3:
					if (self.Criteria.Age() == null)
						self.Criteria.Age(new Range());
					break;
				case 4:
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());
					break;
				case 11:
					if (self.Criteria.CorrelatedCriteria() == null)
						self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
					break;
					/*
									case 8:
										if (typeof self.Criteria.PriorEnrollDays() != "number")
											self.Criteria.PriorEnrollDays(0);
										break;
									case 9:
										if (typeof self.Criteria.AfterEnrollDays() != "number")
											self.Criteria.AfterEnrollDays(0);
										break;
					*/
			};
			self.addCriterionSettings = {
				selectText: "Add criteria attribute…",
				height: 300,
				actionOptions: self.addActions,
				onAction: self.actionHandler
			}
		};

		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.Death;
		self.options = options;

		self.removeCriterion = function (propertyName) {
			self.Criteria[propertyName](null);
		}


	}

	// return compoonent definition
	return {
		viewModel: DeathViewModel,
		template: template
	};
});
