define(
  [
    'knockout',
    'text!./drug-util-detailed.html',
    './base-drug-util-report',
    'appConfig',
    'components/visualizations/filter-panel/filter-panel',
    'less!./drug-util-detailed.less',
  ],
  function (ko, view, BaseDrugUtilReport, appConfig) {

    const componentName = 'cost-utilization-drug-detailed-util';

    class DrugUtilDetailedReport extends BaseDrugUtilReport {

      constructor(params) {
        super(componentName, params);

        this.drugConceptId = params.drugConceptId();
        this.displaySummary = params.displaySummary;

        this.init();
        this.loadFilterOptions({ drugConceptId: this.drugConceptId });
      }

      buildSearchUrl() {
        return `${appConfig.api.url}cohortresults/${this.source}/${this.cohortId}/healthcareutilization/drug/${this.window}/${this.drugConceptId}`;
      }
    }

    const component = {
      viewModel: DrugUtilDetailedReport,
      template: view
    };

    ko.components.register(componentName, component);
    return component;
  }
);
