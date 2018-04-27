define(
  [
    'knockout',
    'text!./drug-util-summary.html',
    './base-drug-util-report',
    'modules/cohortdefinition/services/CohortResultsService',
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
            title: 'OMOP Concept',
            data: 'drugId',
            className: this.classes('tbl-col', 'drug-id'),
            render: id => `<a href=\"#/concept/${id}\">${id}</a>`,
          },
          {
            title: 'Drug',
            data: 'drugName',
            className: this.classes('tbl-col', 'drug'),
          },
          {
            title: 'Concept vocabulary',
            data: 'drugVocabularyId',
            className: this.classes('tbl-col', 'drug-vocab'),
          },
          {
            title: 'Concept class',
            data: 'drugClass',
            className: this.classes('tbl-col', 'drug-class'),
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
