define([
  "knockout",
  "text!./conceptset-warnings.html",
  "services/CohortDefinition",
  "./const",
  "./utils",
  "atlas-state",
  "utils/CommonUtils",
  "databindings",
  "faceted-datatable",
  "css!./style.css",
], function (
  ko,
  view,
  cohortDefinitionApi,
  consts,
  utils,
  sharedState,
  commonUtils
) {
  class ConceptSetWarnings {
    constructor(params) {
      this.currentCohortDefinition = sharedState.CohortDefinition.current;
      this.count = params.count || ko.observable();
      this.infoCount = params.infoCount || ko.observable();
      this.warningCount = params.warningCount || ko.observable();
      this.criticalCount = params.criticalCount || ko.observable();
      this.onFixCallback = params.onFixCallback || function () {};
      this.canDiagnose = params.canDiagnose || ko.observable(false);
      this.warnings = ko.observableArray();
      this.loading = ko.observable(false);
      this.isFixConceptSetCalled = false;
      this.language = ko.i18n("datatable.language");
      this.warningsColumns = [
        {
          data: "severity",
          title: ko.i18n("columns.severity", "Severity"),
          width: "100px",
          render: utils.renderSeverity,
        },
        {
          data: "message",
          title: ko.i18n("columns.message", "Message"),
          width: "100%",
          render: utils.renderMessage,
        },
      ];
      this.warningsOptions = {
        Facets: [
          {
            caption: "Severity",
            binding: (o) => o.severity,
            defaultFacets: ["WARNING", "CRITICAL"],
          },
        ],
      };

      this.warningSubscription = this.currentCohortDefinition.subscribe(() =>
        this.getWarnings()
      );

      this.getWarnings();
    }

    drawCallback(settings) {
      if (settings.aoData) {
        const api = this.api();
        const rows = this.api().rows({ page: "current" });
        const data = rows.data();
        rows.nodes().each((element, index) => {
          const rowData = data[index];
          const context = ko.contextFor(element);
          ko.cleanNode(element);
          ko.applyBindings(context, element);
        });
      }
    }

    stateSaveCallback(settings, data) {
      if (!this.isFixConceptSetCalled) {
        this.state = data;
      }
    }

    stateLoadCallback(settings, callback) {
      return this.state;
    }

    fixRedundantConceptSet(value, parent, event) {
      this.isFixConceptSetCalled = true;
      event.preventDefault();
      this.onFixCallback(value);
      this.onDiagnose();
      this.isFixConceptSetCalled = false;
    }

    showWarnings(result) {
      const count = (severity) =>
        result.warnings.filter((w) => w.severity === severity).length;
      this.warnings(result.warnings);
      this.infoCount(count(consts.WarningSeverity.INFO));
      this.warningCount(count(consts.WarningSeverity.WARNING));
      this.criticalCount(count(consts.WarningSeverity.CRITICAL));
      this.count(result.warnings.length);
      this.loading(false);
    }

    handleError() {
      this.count(0);
      this.warnings.removeAll();
      this.loading(false);
    }

    runDiagnostics(id, expression) {
      this.loading(true);
      cohortDefinitionApi
        .runDiagnostics(id, expression)
        .then((result) => this.showWarnings(result.data))
        .catch((error) => this.handleError(error));
    }

    getWarnings() {
      if (this.currentCohortDefinition()) {
        if (
          parseInt(this.currentCohortDefinition().id(), 10) <= 0 ||
          isNaN(this.currentCohortDefinition().id())
        ) {
          return false;
        }
        this.loading(true);
        cohortDefinitionApi
          .getWarnings(this.currentCohortDefinition().id())
          .then((result) => this.showWarnings(result.data))
          .catch((error) => this.handleError(error));
      }
    }

    onDiagnose() {
      if (this.currentCohortDefinition()) {
        const expressionJSON = ko.toJSON(
          this.currentCohortDefinition().expression(),
          function (key, value) {
            return value === 0 || value ? value : undefined;
          },
          2
        );
        this.runDiagnostics(
          this.currentCohortDefinition().id(),
          expressionJSON
        );
      }
    }

    dispose() {
      this.warningSubscription.dispose();
    }
  }

  return commonUtils.build("conceptset-warnings", ConceptSetWarnings, view);
});
