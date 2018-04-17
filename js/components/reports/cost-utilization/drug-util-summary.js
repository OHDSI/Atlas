define(
  [
    'knockout',
    'text!./drug-util-summary.html',
    './base-drug-util-report',
    '../CohortResultsService',
    'components/visualizations/filter-panel/filter-panel',
    'less!./drug-util-summary.less',
  ],
  function (ko, view, BaseDrugUtilReport, CohortResultsService) {

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

      fetchAPI({ filters }) {
        return CohortResultsService.loadDrugUtilSummaryReport({
            source: this.source,
            cohortId: this.cohortId,
            window: this.window,
            filters,
          })
          .then(({ data }) => this.dataList(data));
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
