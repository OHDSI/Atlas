define(['knockout', '../options', '../utils', '../InputTypes/Range', '../InputTypes/Text', '../CriteriaGroup', 'text!./ObservationTemplate.html'], function (ko, options, utils, Range, Text, CriteriaGroup, template) {

    function ObservationViewModel(params) {
        var self = this;
        self.formatOption = function (d) {
            return '<div class="optionText">' + d.text + '</div>' +
                '<div class="optionDescription">' + d.description + '</div>';
        };
        self.addActions = [
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.first.option.text', "Add First Observation Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.first.option.description', "Limit Observations to the first occurrence."),
                action: function () {
                    if (self.Criteria.First() == null)
                        self.Criteria.First(true);
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.age.option.text', "Add Age at Occurrence Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.age.option.description', "Filter Condition Occurrences by age at occurrence."),
                action: function () {
                    if (self.Criteria.Age() == null)
                        self.Criteria.Age(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.gender.option.text', "Add Gender Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.gender.option.description', "Filter Observations based on Gender."),
                action: function () {
                    if (self.Criteria.Gender() == null)
                        self.Criteria.Gender(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.occurrence-start-date.option.text', "Add Observation Date Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.occurrence-start-date.option.description', "Filter Observations by Date."),
                action: function () {
                    if (self.Criteria.OccurrenceStartDate() == null)
                        self.Criteria.OccurrenceStartDate(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.observation-type.option.text', "Add Observation Type Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.observation-type.option.description', "Filter Observations by the Type."),
                action: function () {
                    if (self.Criteria.ObservationType() == null)
                        self.Criteria.ObservationType(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.visit-type.option.text', "Add Visit Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.visit-type.option.description', "Filter Observations based on visit occurrence of observation."),
				action: function () {
                    if (self.Criteria.VisitType() == null)
                        self.Criteria.VisitType(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.value-as-number.option.text', "Add Value As Number Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.value-as-number.option.description', "Filter Observations  by the Value As Number."),
                action: function () {
                    if (self.Criteria.ValueAsNumber() == null)
                        self.Criteria.ValueAsNumber(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.value-as-string.option.text', "Add Value As String Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.value-as-string.option.description', "Filter Observations by the Value As String."),
                action: function () {
                    if (self.Criteria.ValueAsString() == null)
                        self.Criteria.ValueAsString(new Text({
                            Op: "contains"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.value-as-concept.option.text', "Add Value as Concept Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.value-as-concept.option.description', "Filter Observations by the Value As Concept."),
                action: function () {
                    if (self.Criteria.ValueAsConcept() == null)
                        self.Criteria.ValueAsConcept(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.qualifier.option.text', "Add Qualifier Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.qualifier.option.description', "Filter Observations by Qualifier."),
                action: function () {
                    if (self.Criteria.Qualifier() == null)
                        self.Criteria.Qualifier(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.unit.option.text', "Add Unit Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.unit.option.description', "Filter Observations by Unit."),
				action: function () {
                    if (self.Criteria.Unit() == null)
                        self.Criteria.Unit(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.observation-source-concept.option.text', "Add Observation Source Concept Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.observation-source-concept.option.description', "Filter Observations by the Source Concept."),
                action: function () {
                    if (self.Criteria.ObservationSourceConcept() == null)
                        self.Criteria.ObservationSourceConcept(ko.observable());
                }
            },
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
                                },
            */
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.provider-specialty.option.text', "Add Provider Specialty Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.provider-specialty.option.description', "Filter Observations based on provider specialty."),
				action: function () {
                    if (self.Criteria.ProviderSpecialty() == null)
                        self.Criteria.ProviderSpecialty(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.correlated-criteria.option.text', "Add Nested Criteria..."),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.correlated-criteria.option.description', "Apply criteria using the observation as the index event"),
                action: function () {
                    if (self.Criteria.CorrelatedCriteria() == null)
                        self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
                }
            }
        ];

        self.expression = ko.utils.unwrapObservable(params.expression);
        self.Criteria = params.criteria.Observation;
        self.options = options;

        self.removeCriterion = function (propertyName) {
            self.Criteria[propertyName](null);
        }

		self.indexMessage = ko.i18nformat('cc.viewEdit.design.subgroups.add.observation.criteria.index-data.text', 'The index date refers to the observation of <%= conceptSetName %>.',
			{
				conceptSetName: utils.getConceptSetName(
					self.Criteria.CodesetId,
					self.expression.ConceptSets,
					ko.i18n('cc.viewEdit.design.subgroups.add.observation.criteria.default-concept-name', 'Any Observation'))
			});
    }

    // return compoonent definition
    return {
        viewModel: ObservationViewModel,
        template: template
    };
});
