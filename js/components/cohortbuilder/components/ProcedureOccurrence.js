define(['knockout', '../options', '../utils', '../InputTypes/Range', '../InputTypes/Text', '../CriteriaGroup', 'text!./ProcedureOccurrenceTemplate.html'], function (ko, options, utils, Range, Text, CriteriaGroup, template) {

    function ProcedureOccurrenceViewModel(params) {
        var self = this;
        self.addActions = [
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.first.option.text', "Add First Procedure Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.first.option.description', "Limit Procedure Occurrences to first procedure in history."),
                action: function () {
					if (self.Criteria.First() == null)
						self.Criteria.First(true);
                }
            },
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.age.option.text', "Add Age at Occurrence Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.age.option.description', "Filter Procedure Occurrences by age at occurrence."),
				action: function () {
					if (self.Criteria.Age() == null)
						self.Criteria.Age(new Range());
				}
            }, {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.gender.option.text', "Add Gender Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.gender.option.description', "Filter Procedure Occurrences based on Gender."),
				action: function () {
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());
				}
            },
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.occurrence-start-date.option.text', "Add Start Date Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.occurrence-start-date.option.description', "Filter Procedure Occurrences by the Procedure Start Date."),
				action: function () {
					if (self.Criteria.OccurrenceStartDate() == null)
						self.Criteria.OccurrenceStartDate(new Range({
							Op: "lt"
						}));
				}
            },
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.procedure-type.option.text', "Add Procedure Type Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.procedure-type.option.description', "Filter Procedure Occurrences  by the Procedure Type."),
				action: function () {
					if (self.Criteria.ProcedureType() == null)
						self.Criteria.ProcedureType(ko.observableArray());
				}
            },
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.visit-type.option.text', "Add Visit Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.visit-type.option.description', "Filter Procedure Occurrences based on visit occurrence of procedure."),
				action: function () {
					if (self.Criteria.VisitType() == null)
						self.Criteria.VisitType(ko.observableArray());
				}
            },
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.modifier.option.text', "Add Modifier Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.modifier.option.description', "Filter Procedure Occurrences  by the Modifier."),
				action: function () {
					if (self.Criteria.Modifier() == null)
						self.Criteria.Modifier(ko.observableArray());
				}
            },
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.quantity.option.text', "Add Quantity Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.quantity.option.description', "Filter Procedure Occurrences  by Quantity."),
				action: function () {
					if (self.Criteria.Quantity() == null)
						self.Criteria.Quantity(new Range({
							Op: "lt"
						}));
				}
            },
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.procedure-source-concept.option.text', "Add Procedure Source Concept Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.procedure-source-concept.option.description', "Filter Procedure Occurrences  by the Procedure Source Concept."),
				action: function () {
					if (self.Criteria.ProcedureSourceConcept() == null)
						self.Criteria.ProcedureSourceConcept(ko.observable());
				}
            },
            /*
                         {
                            text: "Add Prior Observation Duration Criteria",
                            value: 8,
                            selected: false,
                            description: "Filter Procedure Occurrences based on Prior Observation Duration."
                                },
                        {
                            text: "Add Post Observation Duration Criteria",
                            value: 9,
                            selected: false,
                            description: "Filter Procedure Occurrences based on Prior Observation Duration."
                                },
            */
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.provider-specialty.option.text', "Add Provider Specialty Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.provider-specialty.option.description', "Filter Procedure Occurrences based on provider specialty."),
				action: function () {
					if (self.Criteria.ProviderSpecialty() == null)
						self.Criteria.ProviderSpecialty(ko.observableArray());
				}
            },
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.correlated-criteria.option.text', "Add Nested Criteria..."),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.correlated-criteria.option.description', "Apply criteria using the procedure occurrence as the index event"),
				action: function () {
					if (self.Criteria.CorrelatedCriteria() == null)
						self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
				}
            }
        ];

        self.expression = ko.utils.unwrapObservable(params.expression);
        self.Criteria = params.criteria.ProcedureOccurrence;
        self.options = options;

        self.removeCriterion = function (propertyName) {
            self.Criteria[propertyName](null);
        }

		self.indexMessage = ko.i18nformat('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.index-data.text', 'The index date refers to the procedure of <%= conceptSetName %>.',
			{
				conceptSetName: utils.getConceptSetName(
					self.Criteria.CodesetId,
					self.expression.ConceptSets,
					ko.i18n('cc.viewEdit.design.subgroups.add.procedure-occurrence.criteria.default-concept-name', 'Any Procedure'))
			});

    }

    // return compoonent definition
    return {
        viewModel: ProcedureOccurrenceViewModel,
        template: template
    };
});
