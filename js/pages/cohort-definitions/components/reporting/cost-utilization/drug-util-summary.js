define(
  [
    'knockout',
    'text!./drug-util-summary.html',
    './base-drug-util-report',
    'services/CohortResultsService',
    'utils/CommonUtils',
    'components/visualizations/filter-panel/filter-panel',
    'less!./drug-util-summary.less',
  ],
  function (
    ko,
    view,
    BaseDrugUtilReport,
    CohortResultsService,
    commonUtils
  ) {

    const componentName = 'cost-utilization-drug-summary-util';

    class DrugUtilSummaryReport extends BaseDrugUtilReport {

      constructor(params) {
        super(params);

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

    return commonUtils.build(componentName, DrugUtilSummaryReport, view);
  }
);
