define(['knockout', '../options', '../utils', '../InputTypes/Range', '../CriteriaGroup', 'text!./DoseEraTemplate.html'], function (ko, options, utils, Range, CriteriaGroup, template) {

    function DoseEraViewModel(params) {

        var self = this;
        self.expression = ko.utils.unwrapObservable(params.expression);
        self.Criteria = params.criteria.DoseEra;
        self.options = options;
        self.addActions = [{
            text: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.first.option.text', "Add First Exposure Criteria"),
            selected: false,
            description: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.first.option.description', "Limit Dose Era to new exposure."),
            action: function () {
                if (self.Criteria.First() == null)
                    self.Criteria.First(true);
            }
        },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.age-at-start.option.text', "Add Age at Era Start Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.age-at-start.option.description', "Filter Drug Eras by age at era start."),
                action: function () {
                    if (self.Criteria.AgeAtStart() == null)
                        self.Criteria.AgeAtStart(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.age-at-era.option.text', "Add Age at Era End Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.age-at-era.option.description', "Filter Drug Eras by age at era end."),
                action: function () {
                    if (self.Criteria.AgeAtEnd() == null)
                        self.Criteria.AgeAtEnd(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.gender.option.text', "Add Gender Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.gender.option.description', "Filter Drug Eras based on Gender."),
                action: function () {
                    if (self.Criteria.Gender() == null)
                        self.Criteria.Gender(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.era-start-date.option.text', "Add Era Start Date Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.era-start-date.option.description', "Filter Dose Eras by the Era Start Date."),
                action: function () {
                    if (self.Criteria.EraStartDate() == null)
                        self.Criteria.EraStartDate(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.era-end-date.option.text', "Add Era End Date Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.era-end-date.option.description', "Filter Dose Eras  by the Era End Date"),
                action: function () {
                    if (self.Criteria.EraEndDate() == null)
                        self.Criteria.EraEndDate(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.unit.option.text', "Add Dose Unit Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.unit.option.description', "Filter Dose Eras by the Unit."),
                action: function () {
                    if (self.Criteria.Unit() == null)
                        self.Criteria.Unit(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.era-length.option.text', "Add Era Length Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.era-length.option.description', "Filter Drug Eras by the Era duration."),
                action: function () {
                    if (self.Criteria.EraLength() == null)
                        self.Criteria.EraLength(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.dose-value.option.text', "Add Dose Value Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.dose-value.option.description', "Filter Dose Eras by the dose value."),
                action: function () {
                    if (self.Criteria.DoseValue() == null)
                        self.Criteria.DoseValue(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.correlated-criteria.option.text', "Add Nested Criteria..."),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.correlated-criteria.option.description', "Apply criteria using the dose era as the index event"),
                action: function () {
                    if (self.Criteria.CorrelatedCriteria() == null)
                        self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
                }
            }
        ];

        self.removeCriterion = function (propertyName) {
            self.Criteria[propertyName](null);
        }

        self.indexMessage = ko.i18nformat('cc.viewEdit.design.subgroups.add.dose-era.criteria.index-data.text', 'The index date refers to the dose era of <%= conceptSetName %>.',
            {
                conceptSetName: utils.getConceptSetName(
                    self.Criteria.CodesetId,
                    self.expression.ConceptSets,
                    ko.i18n('cc.viewEdit.design.subgroups.add.dose-era.criteria.default-concept-name', 'Any Dose Era'))
            });
    }

    // return compoonent definition
    return {
        viewModel: DoseEraViewModel,
        template: template
    };
});
