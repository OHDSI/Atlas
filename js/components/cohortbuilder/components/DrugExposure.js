define(['knockout', '../options', '../utils', '../InputTypes/Range', '../InputTypes/Text', '../CriteriaGroup', 'text!./DrugExposureTemplate.html'], function (ko, options, utils, Range, Text, CriteriaGroup, template) {

    function DrugExposureViewModel(params) {
        var self = this;
        self.formatOption = function (d) {
            return '<div class="optionText">' + d.text + '</div>' +
                '<div class="optionDescription">' + d.description + '</div>';
        };

        self.addActions = [
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.first.option.text', "Add First Exposure Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.first.option.description', "Limit Drug Exposures to the first exposure in history."),
                action: function () {
                    if (self.Criteria.First() == null)
                        self.Criteria.First(true);
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.age.option.text', "Add Age at Occurrence Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.age.option.description', "Filter Drug Exposures by age at occurrence."),
                action: function () {
                    if (self.Criteria.Age() == null)
                        self.Criteria.Age(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.gender.option.text', "Add Gender Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.gender.option.description', "Filter Drug Exposures based on Gender."),
                action: function () {
                    if (self.Criteria.Gender() == null)
                        self.Criteria.Gender(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.occurrence-start-date.option.text', "Add Start Date Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.occurrence-start-date.option.description', "Filter Drug Exposures by the Drug Exposure Start Date."),
                action: function () {
                    if (self.Criteria.OccurrenceStartDate() == null)
                        self.Criteria.OccurrenceStartDate(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.occurrence-end-date.option.text', "Add End Date Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.occurrence-end-date.option.description', "Filter Drug Exposures  by the Drug Exposure End Date"),
                action: function () {
                    if (self.Criteria.OccurrenceEndDate() == null)
                        self.Criteria.OccurrenceEndDate(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.drug-type.option.text', "Add Drug Type Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.drug-type.option.description', "Filter Drug Exposures by the Drug Type."),
                action: function () {
                    if (self.Criteria.DrugType() == null)
                        self.Criteria.DrugType(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.visit-type.option.text', "Add Visit Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.visit-type.option.description', "Filter Drug Exposures based on visit occurrence of drug exposure."),
                action: function () {
                    if (self.Criteria.VisitType() == null)
                        self.Criteria.VisitType(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.stop-reason.option.text', "Add Stop Reason Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.stop-reason.option.description', "Filter Drug Exposures by the Stop Reason."),
                action: function () {
                    if (self.Criteria.StopReason() == null)
                        self.Criteria.StopReason(new Text({
                            Op: "contains"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.refills.option.text', "Add Refills Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.refills.option.description', "Filter Drug Exposures by Refills."),
                action: function () {
                    if (self.Criteria.Refills() == null)
                        self.Criteria.Refills(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.quantity.option.text', "Add Quantity Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.quantity.option.description', "Filter Drug Exposures by Quantity."),
                action: function () {
                    if (self.Criteria.Quantity() == null)
                        self.Criteria.Quantity(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.days-supply.option.text', "Add Days Supply Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.days-supply.option.description', "Filter Drug Exposures by Days Supply."),
                action: function () {
                    if (self.Criteria.DaysSupply() == null)
                        self.Criteria.DaysSupply(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.route-concept.option.text', "Add Route Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.route-concept.option.description', "Filter Drug Exposures by Route."),
                action: function () {
                    if (self.Criteria.RouteConcept() == null)
                        self.Criteria.RouteConcept(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.effective-drug-dose.option.text', "Add Effective Dose Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.effective-drug-dose.option.description', "Filter Drug Exposures by Effective Dose."),
                action: function () {
                    if (self.Criteria.EffectiveDrugDose() == null)
                        self.Criteria.EffectiveDrugDose(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.dose-unit.option.text', "Add Dose Unit Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.dose-unit.option.description', "Filter Drug Exposures by Dose Unit."),
                action: function () {
                    if (self.Criteria.DoseUnit() == null)
                        self.Criteria.DoseUnit(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.lot-number.option.text', "Add Lot Number Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.lot-number.option.description', "Filter Drug Exposures by Lot Number."),
                action: function () {
                    if (self.Criteria.LotNumber() == null)
                        self.Criteria.LotNumber(new Text({
                            Op: "contains"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.drug-source-concept.option.text', "Add Drug Source Concept Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.drug-source-concept.option.description', "Filter Drug Exposures by the Drug Source Concept."),
                action: function () {
                    if (self.Criteria.DrugSourceConcept() == null)
                        self.Criteria.DrugSourceConcept(ko.observable());
                }
            },
            /*
                         {
                            text: "Add Prior Observation Duration Criteria",
                            value: 8,
                            selected: false,
                            description: "Filter Drug Exposures based on Prior Observation Duration."
                                },
                        {
                            text: "Add Post Observation Duration Criteria",
                            value: 9,
                            selected: false,
                            description: "Filter Drug Exposures based on Prior Observation Duration."
                                },
            */
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.provider-specialty.option.text', "Add Provider Specialty Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.provider-specialty.option.description', "Filter Drug Exposures based on provider specialty."),
                action: function () {
                    if (self.Criteria.ProviderSpecialty() == null)
                        self.Criteria.ProviderSpecialty(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.correlated-criteria.option.text', "Add Nested Criteria..."),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.correlated-criteria.option.description', "Apply criteria using the drug exposure as the index event"),
                action: function () {
                    if (self.Criteria.CorrelatedCriteria() == null)
                        self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
                }
            }
        ];


        self.expression = ko.utils.unwrapObservable(params.expression);
        self.Criteria = params.criteria.DrugExposure;
        self.options = options;

        self.removeCriterion = function (propertyName) {
            self.Criteria[propertyName](null);
        }


        self.indexMessage = ko.i18nformat('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.index-data.text', 'The index date refers to the drug exposure of <%= conceptSetName %>.',
            {
                conceptSetName: utils.getConceptSetName(
                    self.Criteria.CodesetId,
                    self.expression.ConceptSets,
                    ko.i18n('cc.viewEdit.design.subgroups.add.drug-exposure.criteria.default-concept-name', 'Any Drug'))
            });

    }

    // return compoonent definition
    return {
        viewModel: DrugExposureViewModel,
        template: template
    };
});
