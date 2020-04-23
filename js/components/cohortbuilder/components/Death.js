define(['knockout', '../options', '../utils', '../InputTypes/Range', '../InputTypes/Text', '../CriteriaGroup', 'text!./DeathTemplate.html'], function (ko, options, utils, Range, Text, CriteriaGroup, template) {

    function DeathViewModel(params) {
        var self = this;

        self.addActions = [
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.death.criteria.age.option.text', 'Add Age at Occurrence Criteria'),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.death.criteria.age.option.description', 'Filter by age at death.'),
                action: function () {
                    if (self.Criteria.Age() == null)
                        self.Criteria.Age(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.death.criteria.gender.option.text', 'Add Gender Criteria'),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.death.criteria.gender.option.description', 'Filter Deaths based on Gender.'),
                action: function () {
                    if (self.Criteria.Gender() == null)
                        self.Criteria.Gender(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.death.criteria.death-date.option.text', 'Add Death Date Criteria'),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.death.criteria.death-date.option.description', 'Filter Death by Date.'),
                action: function () {
                    if (self.Criteria.OccurrenceStartDate() == null)
                        self.Criteria.OccurrenceStartDate(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.death.criteria.death-type.option.text', 'Add Death Type Criteria'),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.death.criteria.death-type.option.description', 'Filter by Death Type.'),
                action: function () {
                    if (self.Criteria.DeathType() == null)
                        self.Criteria.DeathType(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.death.criteria.cause-of-death-source-concept.option.text', 'Add Cause of Death Source Concept Criteria'),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.death.criteria.cause-of-death-source-concept.option.description', 'Filter Death by the Death Source Concept.'),
                action: function () {
                    if (self.Criteria.DeathSourceConcept() == null)
                        self.Criteria.DeathSourceConcept(ko.observable());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.death.criteria.nest-criteria.option.text', 'Add Nested Criteria...'),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.death.criteria.nest-criteria.option.description', 'Apply criteria using the death occurrence as the index event...'),
                action: function () {
                    if (self.Criteria.CorrelatedCriteria() == null)
                        self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
                }
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

        self.expression = ko.utils.unwrapObservable(params.expression);
        self.Criteria = params.criteria.Death;
        self.options = options;

        self.removeCriterion = function (propertyName) {
            self.Criteria[propertyName](null);
        }

        self.indexMessage = ko.i18nformat('cc.viewEdit.design.subgroups.add.death.criteria.index-data.text', 'The index date refers to the death event of <%= conceptSetName %>.',
            {
                conceptSetName: utils.getConceptSetName(
                    self.Criteria.CodesetId,
                    self.expression.ConceptSets,
                    ko.i18n('cc.viewEdit.design.subgroups.add.death.criteria.default-concept-name', 'Any Death'))
            });

    }

    // return compoonent definition
    return {
        viewModel: DeathViewModel,
        template: template
    };
});
