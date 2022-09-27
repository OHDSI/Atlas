define([
    "knockout",
    "../options",
    "../CriteriaGroup",
    "../CriteriaTypes",
    "../CohortExpression",
    "../InclusionRule",
    "text!./CensoringCriteriaEditor.html",
    "../const",
    "less!./CensoringCriteriaEditor.less",
], function (
    ko,
    options,
    CriteriaGroup,
    criteriaTypes,
    CohortExpression,
    InclusionRule,
    template,
    constants
) {
    function CensoringCriteriaViewModel(params) {
        var self = this;

        self.expression = params.expression;

        self.censorCriteriaOptions = [
            {
                ...constants.censoringEventList.addConditionEra,
                selected: false,
                action: function () {
                    var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
                    unwrappedExpression.CensoringCriteria.push({
                        ConditionEra: new criteriaTypes.ConditionEra(
                            null,
                            unwrappedExpression.ConceptSets
                        ),
                    });
                },
            },
            {
                ...constants.censoringEventList.addConditionOccurrence,
                selected: false,
                action: function () {
                    var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
                    unwrappedExpression.CensoringCriteria.push({
                        ConditionOccurrence: new criteriaTypes.ConditionOccurrence(
                            null,
                            unwrappedExpression.ConceptSets
                        ),
                    });
                },
            },
            {
                ...constants.censoringEventList.addDeath,
                selected: false,
                action: function () {
                    var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
                    unwrappedExpression.CensoringCriteria.push({
                        Death: new criteriaTypes.Death(
                            null,
                            unwrappedExpression.ConceptSets),
                    });
                },
            },
            {
                ...constants.censoringEventList.addDeviceExposure,
                selected: false,
                action: function () {
                    var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
                    unwrappedExpression.CensoringCriteria.push({
                        DeviceExposure: new criteriaTypes.DeviceExposure(
                            null,
                            unwrappedExpression.ConceptSets
                        ),
                    });
                },
            },
            {
                ...constants.censoringEventList.addDoseEra,
                selected: false,
                action: function () {
                    var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
                    unwrappedExpression.CensoringCriteria.push({
                        DoseEra: new criteriaTypes.DoseEra(
                            null,
                            unwrappedExpression.ConceptSets
                        ),
                    });
                },
            },
            {
                ...constants.censoringEventList.addDrugEra,
                selected: false,
                action: function () {
                    var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
                    unwrappedExpression.CensoringCriteria.push({
                        DrugEra: new criteriaTypes.DrugEra(
                            null,
                            unwrappedExpression.ConceptSets
                        ),
                    });
                },
            },
            {
                ...constants.censoringEventList.addDrugExposure,
                selected: false,
                action: function () {
                    var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
                    unwrappedExpression.CensoringCriteria.push({
                        DrugExposure: new criteriaTypes.DrugExposure(
                            null,
                            unwrappedExpression.ConceptSets
                        ),
                    });
                },
            },
            {
                ...constants.censoringEventList.addMeasurement,
                selected: false,
                action: function () {
                    var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
                    unwrappedExpression.CensoringCriteria.push({
                        Measurement: new criteriaTypes.Measurement(
                            null,
                            unwrappedExpression.ConceptSets
                        ),
                    });
                },
            },
            {
                ...constants.censoringEventList.addObservation,
                selected: false,
                action: function () {
                    var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
                    unwrappedExpression.CensoringCriteria.push({
                        Observation: new criteriaTypes.Observation(
                            null,
                            unwrappedExpression.ConceptSets
                        ),
                    });
                },
            },
            {
                ...constants.censoringEventList.addPayerPlanPeriod,
                selected: false,
                action: function () {
                    var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
                    unwrappedExpression.CensoringCriteria.push({
                        PayerPlanPeriod: new criteriaTypes.PayerPlanPeriod(
                            null,
                            unwrappedExpression.ConceptSets
                        ),
                    });
                },
            },
            {
                ...constants.censoringEventList.addProcedureOccurrence,
                selected: false,
                action: function () {
                    var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
                    unwrappedExpression.CensoringCriteria.push({
                        ProcedureOccurrence: new criteriaTypes.ProcedureOccurrence(
                            null,
                            unwrappedExpression.ConceptSets
                        ),
                    });
                },
            },
            {
                ...constants.censoringEventList.addSpecimen,
                selected: false,
                action: function () {
                    var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
                    unwrappedExpression.CensoringCriteria.push({
                        Specimen: new criteriaTypes.Specimen(
                            null,
                            unwrappedExpression.ConceptSets
                        )
                    });
                }
            },
            {
                ...constants.censoringEventList.addVisit,
                selected: false,
                action: function () {
                    var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
                    unwrappedExpression.CensoringCriteria.push({
                        VisitOccurrence: new criteriaTypes.VisitOccurrence(
                            null,
                            unwrappedExpression.ConceptSets
                        ),
                    });
                },
            },
            {
                ...constants.censoringEventList.addVisitDetail,
                selected: false,
                action: function () {
                    var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
                    unwrappedExpression.CensoringCriteria.push({
                        VisitDetail: new criteriaTypes.VisitDetail(
                            null,
                            unwrappedExpression.ConceptSets
                        ),
                    });
                },
            },
            {
                ...constants.censoringEventList.fromReusable,
                selected: false,
                action: function () {
                    self.showReusablesModal(true);
                }
            },
        ];

        self.removeCensoringCriteria = function (criteria) {
            ko.utils.unwrapObservable(self.expression).CensoringCriteria.remove(criteria);
        };

        self.getCriteriaIndexComponent = function (data) {
            data = ko.utils.unwrapObservable(data);

            if (data.hasOwnProperty("ConditionOccurrence"))
                return "condition-occurrence-criteria";
            else if (data.hasOwnProperty("ConditionEra"))
                return "condition-era-criteria";
            else if (data.hasOwnProperty("DrugExposure"))
                return "drug-exposure-criteria";
            else if (data.hasOwnProperty("DrugEra")) return "drug-era-criteria";
            else if (data.hasOwnProperty("DoseEra")) return "dose-era-criteria";
            else if (data.hasOwnProperty("ProcedureOccurrence"))
                return "procedure-occurrence-criteria";
            else if (data.hasOwnProperty("Observation"))
                return "observation-criteria";
            else if (data.hasOwnProperty("VisitOccurrence"))
                return "visit-occurrence-criteria";
            else if (data.hasOwnProperty("VisitDetail"))
                return "visit-detail-criteria";
            else if (data.hasOwnProperty("DeviceExposure"))
                return "device-exposure-criteria";
            else if (data.hasOwnProperty("Measurement"))
                return "measurement-criteria";
            else if (data.hasOwnProperty("Specimen")) return "specimen-criteria";
            else if (data.hasOwnProperty("ObservationPeriod"))
                return "observation-period-criteria";
            else if (data.hasOwnProperty("PayerPlanPeriod"))
                return "payer-plan-period-criteria";
            else if (data.hasOwnProperty("Death")) return "death-criteria";
            else if (data.hasOwnProperty("LocationRegion"))
                return "location-region-criteria";
            else return "unknownCriteriaType";
        };

        self.showReusablesModal = ko.observable(false);
        self.insertFromReusable = (expression, conceptSets) => {
            const unwrappedExpression = ko.utils.unwrapObservable(self.expression);
            if (conceptSets.length > 0) {
                unwrappedExpression.ConceptSets(unwrappedExpression.ConceptSets().concat(conceptSets));
            }
            ko.utils.arrayForEach(expression.CriteriaList(), c => {
                unwrappedExpression.CensoringCriteria.push(c);
            });
        };
    }

    return {
        viewModel: CensoringCriteriaViewModel,
        template: template
    };
});