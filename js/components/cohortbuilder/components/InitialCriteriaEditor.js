define([
    "knockout",
    "../options",
    "../CriteriaGroup",
    "../CriteriaTypes",
    "../CohortExpression",
    "../InclusionRule",
    "text!./InitialCriteriaEditor.html",
    "../const",
    "less!./InitialCriteriaEditor.less",
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
    function InitialCriteriaViewModel(params) {
        var self = this;

        self.expression = params.expression;
        self.buttonText = params.buttonText || ko.i18n('components.cohortExpressionEditor.addInitialEvent', 'Add Initial Event');

        self.primaryCriteriaOptions = [        
            {
                ...constants.initialEventList.addObservation,
                selected: false,
                action: function () {
                    var unwrappedExpression = ko.utils.unwrapObservable(self.expression);
                    unwrappedExpression
                        .PrimaryCriteria()
                        .CriteriaList.push({
                        Observation: new criteriaTypes.Observation(
                            null,
                            unwrappedExpression.ConceptSets
                        ),
                    });
                },
            },
            {
                ...constants.initialEventList.fromReusable,
                selected: false,
                action: function () {
                    self.showReusablesModal(true);
                }
            },
        ];

        self.removePrimaryCriteria = function (criteria) {
            ko.utils.unwrapObservable(self.expression).PrimaryCriteria().CriteriaList.remove(criteria);
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
                unwrappedExpression.PrimaryCriteria().CriteriaList.push(c);
            });
        };
    }

    return {
        viewModel: InitialCriteriaViewModel,
        template: template
    };
});
