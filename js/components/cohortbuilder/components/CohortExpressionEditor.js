define([
  "knockout",
  "jquery",
  "../options",
  "../CriteriaGroup",
  "../CriteriaTypes",
  "../CohortExpression",
  "../InclusionRule",
  "text!./CohortExpressionEditorTemplate.html",
  "../const",
  "./EndStrategyEditor",
  "databindings",
  "conceptpicker/ConceptPicker",
  "css!../css/builder.css",
  "ko.sortable",
  "less!./CohortExpressionEditor.less",
], function (
  ko,
  $,
  options,
  CriteriaGroup,
  criteriaTypes,
  CohortExpression,
  InclusionRule,
  template,
  constants
) {
  function CohortExpressionEditorViewModel(params) {
    var self = this;
    this.expressionMode = ko.observable("all");
    self.helpCohortEventsOpened = ko.observable(false);
    self.helpInclusionCriteriaOpened = ko.observable(false);
    self.helpCohortExitOpened = ko.observable(false);

    if (params.widget) {
      params.widget(this);
    }

    self.expression = params.expression;
    self.options = options;

    self.showCensorWindow = ko.observable(
      self.expression().CensorWindow().StartDate() ||
        self.expression().CensorWindow().EndDate()
    );
    self.selectedInclusionRule = ko.observable(null);
    self.selectedInclusionRuleIndex = null;

    self.selectInclusionRule = function (inclusionRule) {
      self.selectedInclusionRule(inclusionRule);
      self.selectedInclusionRuleIndex = params
        .expression()
        .InclusionRules()
        .indexOf(inclusionRule);
    };

    self.removeAdditionalCriteria = function () {
      self.expression().AdditionalCriteria(null);
    };

    self.addAdditionalCriteria = function () {
      self
        .expression()
        .AdditionalCriteria(
          new CriteriaGroup(null, self.expression().ConceptSets)
        );
    };

    self.addInclusionRule = function () {
      var newInclusionRule = new InclusionRule(
        null,
        self.expression().ConceptSets
      );
      self.expression().InclusionRules.push(newInclusionRule);
      self.selectInclusionRule(newInclusionRule);
    };

    self.deleteInclusionRule = function (inclusionRule) {
      self.selectedInclusionRule(null);
      self.expression().InclusionRules.remove(inclusionRule);
    };

    self.copyInclusionRule = function (inclusionRule) {
      var copiedRule = new InclusionRule(
        ko.toJS(inclusionRule),
        self.expression().ConceptSets
      );
      var name = copiedRule.name() || ko.unwrap(ko.i18n('components.cohortExpressionEditor.unnamedCriteria', 'Unnamed Criteria'))
      copiedRule.name(ko.i18nformat('common.copyOf', 'Copy of <%=name%>', {name: name})());
      self.expression().InclusionRules.push(copiedRule);
      self.selectedInclusionRule(copiedRule);
    };

    self.addPrimaryCriteriaOptions = {
      selectText: ko.i18n('components.cohortExpressionEditor.addInitialEvent', 'Add Initial Event...'),
      width: 250,
      height: 300,
      actionOptions: self.primaryCriteriaOptions,
      onAction: function (data) {
        data.selectedData.action();
      },
    };

    self.addCensorCriteriaOptions = {
      selectText: ko.i18n('components.cohortExpressionEditor.addCensoringEvent', 'Add Censoring Event...'),
      width: 250,
      height: 300,
      actionOptions: self.censorCriteriaOptions,
      onAction: function (data) {
        data.selectedData.action();
      },
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

    self.getExpressionJSON = function () {
      return ko.toJSON(
        self.expression(),
        function (key, value) {
          if (value === 0 || value) {
            return value;
          } else {
            return;
          }
        },
        2
      );
    };

    self.inclusionRuleNavMinHeight = function () {
      return (
        Math.max(
          75,
          Math.min(550, self.expression().InclusionRules().length * 40)
        ) + "px"
      );
    };

    // Subscriptions

    self.expressionSubscription = self.expression.subscribe(function (newVal) {
      self.selectedInclusionRule(
        params.expression().InclusionRules()[self.selectedInclusionRuleIndex]
      );
    });

    // Cleanup

    self.dispose = function () {
      self.expressionSubscription.dispose();
    };
  }

  // return factory
  return {
    viewModel: CohortExpressionEditorViewModel,
    template: template,
  };
});
