define(['knockout', '../options', '../InputTypes/Range', '../InputTypes/Period', '../CriteriaGroup', 'text!./ObservationPeriodTemplate.html'], function (ko, options, Range, Period, CriteriaGroup, template) {

    function ObservationPeriodViewModel(params) {
        var self = this;

        self.expression = ko.utils.unwrapObservable(params.expression);
        self.Criteria = params.criteria.ObservationPeriod;
        self.options = options;


        self.addActions = [
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.first.option.text', "First Observation Period Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.first.option.description', "Limit Observation Period to first period in history."),
                action: function () {
                    if (self.Criteria.First() == null)
                        self.Criteria.First(true);
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.age-at-start.option.text', "Add Age at Start Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.age-at-start.option.description', "Filter Periods by Age at Start."),
                action: function () {
                    if (self.Criteria.AgeAtStart() == null)
                        self.Criteria.AgeAtStart(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.user-defined-period.option.text', "Specify Start and End Dates"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.user-defined-period.option.description', "Specify start and end date to use for the Observation Period."),
                action: function () {
                    if (self.Criteria.UserDefinedPeriod() == null)
                        self.Criteria.UserDefinedPeriod(new Period());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.age-at-end.option.text', "Add Age at End Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.age-at-end.option.description', "Filter Periods by age at End."),
                action: function () {
                    if (self.Criteria.AgeAtEnd() == null)
                        self.Criteria.AgeAtEnd(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.period-start-date.option.text', "Add Period Start Date Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.period-start-date.option.description', "Filter Observation Periods by Start Date."),
                action: function () {
                    if (self.Criteria.PeriodStartDate() == null)
                        self.Criteria.PeriodStartDate(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.period-end-date.option.text', "Add Period End Date Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.period-end-date.option.description', "Filter Observation Periods by End Date."),
                action: function () {
                    if (self.Criteria.PeriodEndDate() == null)
                        self.Criteria.PeriodEndDate(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.period-type.option.text', "Add Period Type Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.period-type.option.description', "Filter Obsevation Periods by Type."),
				action: function () {
                    if (self.Criteria.PeriodType() == null)
                        self.Criteria.PeriodType(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.period-length.option.text', "Add Period Length Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.period-length.option.description', "Filter Observation Periods by duration."),
                action: function () {
                    if (self.Criteria.PeriodLength() == null)
                        self.Criteria.PeriodLength(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.correlated-criteria.option.text', "Add Nested Criteria..."),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.observation-period.criteria.correlated-criteria.option.description', "Apply criteria using the observation period as the index event"),
                action: function () {
                    if (self.Criteria.CorrelatedCriteria() == null)
                        self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
                }
            }
        ];

        self.removeCriterion = function (propertyName) {
            self.Criteria[propertyName](null);
        }
    }

    // return compoonent definition
    return {
        viewModel: ObservationPeriodViewModel,
        template: template
    };
});
