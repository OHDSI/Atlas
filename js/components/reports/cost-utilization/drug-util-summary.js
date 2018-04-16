define(
  [
    'knockout',
    'text!./drug-util-summary.html',
    './base-drug-util-report',
    'appConfig',
    'components/visualizations/filter-panel/filter-panel',
    'less!./drug-util-summary.less',
  ],
  function (ko, view, BaseDrugUtilReport, appConfig) {

    const componentName = 'cost-utilization-drug-summary-util';

    class DrugUtilSummaryReport extends BaseDrugUtilReport {

      constructor(params) {
        super(componentName, params);

        this.onDrugSelect = params.onDrugSelect;

        this.drugsTableColumns = [
          {
            title: 'Drug',
            data: 'drugName',
            className: this.classes('tbl-col', 'drug'),
          },
          ...this.drugsTableColumns,
        ];

        this.init();
        this.loadFilterOptions();
      }

      buildSearchUrl() {
        return `${appConfig.api.url}cohortresults/${this.source}/${this.cohortId}/healthcareutilization/drug/${this.window}`;
      }
    }

    const component = {
      viewModel: DrugUtilSummaryReport,
      template: view
    };

    ko.components.register(componentName, component);
    return component;
  }
);
