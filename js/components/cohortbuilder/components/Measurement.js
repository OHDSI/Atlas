define(['knockout', '../options', '../utils', '../InputTypes/Range', '../InputTypes/Text', '../CriteriaGroup', 'text!./MeasurementTemplate.html'], function (ko, options, utils, Range, Text, CriteriaGroup, template) {

    function MeasurementViewModel(params) {
        var self = this;

        self.expression = ko.utils.unwrapObservable(params.expression);
        self.Criteria = params.criteria.Measurement;
        self.options = options;

        self.addActions = [
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.first.option.text', "Add First Measure Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.first.option.description', "Limit Measures to first occurrence in history."),
                action: function () {
                    if (self.Criteria.First() == null)
                        self.Criteria.First(true);
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.age.option.text', "Add Age at Occurrence Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.age.option.description', "Filter Measurements by age at occurrence."),
                action: function () {
                    if (self.Criteria.Age() == null)
                        self.Criteria.Age(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.gender.option.text', "Add Gender Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.gender.option.description', "Filter Measurements based on Gender."),
                action: function () {
                    if (self.Criteria.Gender() == null)
                        self.Criteria.Gender(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.occurrence-start.option.text', "Add Measurement Date Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.occurrence-start.option.description', "Filter Measurements by Date."),
                action: function () {
                    if (self.Criteria.OccurrenceStartDate() == null)
                        self.Criteria.OccurrenceStartDate(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.measurement-type.option.text', "Add Measurement Type Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.measurement-type.option.description', "Filter Measurements by the Measurement Type."),
                action: function () {
                    if (self.Criteria.MeasurementType() == null)
                        self.Criteria.MeasurementType(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.visit-type.option.text', "Add Visit Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.visit-type.option.description', "Filter Measurements based on visit occurrence of measurement."),
                action: function () {
                    if (self.Criteria.VisitType() == null)
                        self.Criteria.VisitType(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.operator.option.text', "Add Operator Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.operator.option.description', "Filter Measurements by Operator."),
                action: function () {
                    if (self.Criteria.Operator() == null)
                        self.Criteria.Operator(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.value-as-number.option.text', "Add Value as Number Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.value-as-number.option.description', "Filter Measurements by Value as Number."),
                action: function () {
                    if (self.Criteria.ValueAsNumber() == null)
                        self.Criteria.ValueAsNumber(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.value-as-concept.option.text', "Add Value as Concept Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.value-as-concept.option.description', "Filter Measurements by Value as Concept."),
                action: function () {
                    if (self.Criteria.ValueAsConcept() == null)
                        self.Criteria.ValueAsConcept(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.unit.option.text', "Add Unit Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.unit.option.description', "Filter Measurements by the Unit."),
                action: function () {
                    if (self.Criteria.Unit() == null)
                        self.Criteria.Unit(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.abnormal.option.text', "Add Abnormal Result Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.abnormal.option.description', "Filter Measurements to include those which fall outside of normal range."),
                action: function () {
                    if (self.Criteria.Abnormal() == null)
                        self.Criteria.Abnormal(true);
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.range-low.option.text', "Add Low Range Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.range-low.option.description', "Filter Measurements Low Range."),
                action: function () {
                    if (self.Criteria.RangeLow() == null)
                        self.Criteria.RangeLow(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.range-high.option.text', "Add High Range Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.range-high.option.description', "Filter Measurements by the Measurement Type."),
                action: function () {
                    if (self.Criteria.RangeHigh() == null)
                        self.Criteria.RangeHigh(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.range-low-ratio.option.text', "Add Low Range Ratio Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.range-low-ratio.option.description', "Filter Measurements by the Ratio of Value as Number to Range Low."),
                action: function () {
                    if (self.Criteria.RangeLowRatio() == null)
                        self.Criteria.RangeLowRatio(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.range-high-ratio.option.text', "Add High Range Ratio Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.range-high-ratio.option.description', "Filter Measurements by the Ratio of Value as Number to Range High."),
                action: function () {
                    if (self.Criteria.RangeHighRatio() == null)
                        self.Criteria.RangeHighRatio(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.provider-specialty.option.text', "Add Provider Specialty Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.provider-specialty.option.description', "Filter Measurements based on provider specialty."),
                action: function () {
                    if (self.Criteria.ProviderSpecialty() == null)
                        self.Criteria.ProviderSpecialty(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.measurement-source-concept.option.text', "Add Measurement Source Concept Criteria"),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.measurement-source-concept.option.description', "Filter Measurements by the Measurement Source Concept."),
				action: function () {
                    if (self.Criteria.MeasurementSourceConcept() == null)
                        self.Criteria.MeasurementSourceConcept(ko.observable());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.correlated-criteria.option.text', "Add Nested Criteria..."),
				selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.correlated-criteria.option.description', "Apply criteria using the measurement as the index event"),
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
            var conceptSetName = utils.getConceptSetName(self.Criteria.CodesetId, self.expression.ConceptSets, '');
            return `${conceptSetName}.`;
        });

		self.indexMessage = ko.i18nformat('cc.viewEdit.design.subgroups.add.measurement.criteria.index-data.text', 'The index date refers to the measurement of <%= conceptSetName %>.',
			{
				conceptSetName: utils.getConceptSetName(
					self.Criteria.CodesetId,
					self.expression.ConceptSets,
					ko.i18n('cc.viewEdit.design.subgroups.add.measurement.criteria.default-concept-name', 'Any Measurement'))
			});
    }

    // return compoonent definition
    return {
        viewModel: MeasurementViewModel,
        template: template
    };
});
