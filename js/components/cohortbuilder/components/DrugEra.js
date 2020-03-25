define(['knockout', '../options', '../utils', '../InputTypes/Range', '../CriteriaGroup', 'text!./DrugEraTemplate.html'], function (ko, options, utils, Range, CriteriaGroup, template) {

    function DrugEraViewModel(params) {

        var self = this;
        self.expression = ko.utils.unwrapObservable(params.expression);
        self.Criteria = params.criteria.DrugEra;
        self.options = options;
        self.addActions = [
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.first.option.text', "Add First Exposure Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.first.option.description', "Limit Drug Eras to first exposure in history."),
                action: function () {
                    if (self.Criteria.First() == null)
                        self.Criteria.First(true);
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.age-at-start.option.text', "Add Age at Era Start Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.age-at-start.option.description', "Filter Drug Eras by age at era start."),
                action: function () {
                    if (self.Criteria.AgeAtStart() == null)
                        self.Criteria.AgeAtStart(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.age-at-end.option.text', "Add Age at Era End Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.age-at-end.option.description', "Filter Drug Eras by age at era end."),
                action: function () {
                    if (self.Criteria.AgeAtEnd() == null)
                        self.Criteria.AgeAtEnd(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.gender.option.text', "Add Gender Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.gender.option.description', "Filter Drug Eras based on Gender."),
                action: function () {
                    if (self.Criteria.Gender() == null)
                        self.Criteria.Gender(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.era-start-date.option.text', "Add Era Start Date Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.era-start-date.option.description', "Filter Drug Eras by the Era Start Date."),
                action: function () {
                    if (self.Criteria.EraStartDate() == null)
                        self.Criteria.EraStartDate(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.era-end-date.option.text', "Add Era End Date Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.era-end-date.option.description', "Filter Drug Eras  by the Era End Date"),
                action: function () {
                    if (self.Criteria.EraEndDate() == null)
                        self.Criteria.EraEndDate(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.era-length.option.text', "Add Era Length Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.era-length.option.description', "Filter Drug Eras by the Era duration."),
                action: function () {
                    if (self.Criteria.EraLength() == null)
                        self.Criteria.EraLength(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.occurrence-count.option.text', "Add Era Exposure Count Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.occurrence-count.option.description', "Filter Drug Eras by the Exposure Count."),
                action: function () {
                    if (self.Criteria.OccurrenceCount() == null)
                        self.Criteria.OccurrenceCount(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.correlatedCriteria.option.text', "Add Nested Criteria..."),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.correlatedCriteria.option.description', "Apply criteria using the drug era as the index event"),
                action: function () {
                    if (self.Criteria.CorrelatedCriteria() == null)
                        self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
                }
            }
        ];

        self.removeCriterion = function (propertyName) {
            self.Criteria[propertyName](null);
        }


        self.indexMessage = ko.i18nformat('cc.viewEdit.design.subgroups.add.drug-era.criteria.index-data.text', 'The index date refers to the drug era of <%= conceptSetName %>.',
            {
                conceptSetName: utils.getConceptSetName(
                    self.Criteria.CodesetId,
                    self.expression.ConceptSets,
                    ko.i18n('cc.viewEdit.design.subgroups.add.drug-era.criteria.default-concept-name', 'Any Drug'))
            });
    }

    // return compoonent definition
    return {
        viewModel: DrugEraViewModel,
        template: template
    };
});
