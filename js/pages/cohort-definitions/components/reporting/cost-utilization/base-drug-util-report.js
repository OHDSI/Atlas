define(
  [
    'knockout',
    'text!./drug-util-detailed.html',
    'pages/cohort-definitions/components/reporting/cost-utilization/base-report',
    'appConfig',
    'utils/BemHelper',
    'appConfig',
    'pages/cohort-definitions/const',
    'services/CohortResults',
    'components/visualizations/filter-panel/filter-panel',
    'less!./drug-util-detailed.less',
  ],
  function (ko, view, BaseCostUtilReport, appConfig, BemHelper, config, costUtilConst, CohortResultsService) {

    const DRUG_SOURCE_TYPE = 'drugType';

    class BaseDrugUtilReport extends BaseCostUtilReport {

      constructor(params) {
        super(params);
        this.setupDrugSourceConceptOptions = this.setupDrugSourceConceptOptions.bind(this);

        this.window = params.window;

        this.filtersLoading = ko.observable(false);

        this.drugsTableColumns = [
          {
            title: 'Persons',
            data: 'personsCount',
            className: this.classes('tbl-col', 'persons-count'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Records',
            data: 'exposureCount',
            className: this.classes('tbl-col', 'exposure-cnt'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Records/1K',
            data: 'exposuresPer1000',
            className: this.classes('tbl-col', 'exposures-per-1000'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Records /1K +record',
            data: 'exposurePer1000WithExposures',
            className: this.classes('tbl-col', 'records-per-1000-with-records'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Records /1K /Year',
            data: 'exposurePer1000PerYear',
            className: this.classes('tbl-col', 'records-per-1000-per-year'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Days of Supply',
            data: 'daysSupplyTotal',
            className: this.classes('tbl-col', 'total-days-supply'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Avg. Days of Supply',
            data: 'daysSupplyAvg',
            className: this.classes('tbl-col', 'avg-days-supply'),
            showInChart: true,
            render: BaseCostUtilReport.formatPreciseNumber,
          },
          {
            title: 'Days of Supply /1K /Year',
            data: 'daysSupplyPer1000PerYear',
            className: this.classes('tbl-col', 'days-supply-per-1000-per-year'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Total Quantity',
            data: 'quantityTotal',
            className: this.classes('tbl-col', 'total-quantity'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Avg. Quantity',
            data: 'quantityAvg',
            className: this.classes('tbl-col', 'avg-quantity'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Quantity /1K /Year',
            data: 'quantityPer1000PerYear',
            className: this.classes('tbl-col', 'quantity-per-1000-per-year'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          ...(appConfig.enableCosts ? this.getCostColumns() : []),
        ];
      }

      getFilterList() {
        return [
          costUtilConst.getPeriodTypeFilter(this.periods),
          {
            type: 'select',
            label: 'Drug Source',
            name: DRUG_SOURCE_TYPE,
            options: ko.observableArray([]),
            selectedValue: ko.observable(null),
          },
        ];
      }

      setupDrugSourceConceptOptions(conceptList) {
        const filter = this.filterList().find(filter => filter.name === DRUG_SOURCE_TYPE);
        filter.options([
          { label: 'All drug sources', value: null },
          ...BaseCostUtilReport.conceptsToOptions(conceptList)
        ]);
      }

      async loadFilterOptions({ drugConceptId } = {}) {
        this.filtersLoading(true);
        try {
          const res = await CohortResultsService.loadDrugTypesConcepts({ source: this.source, cohortId: this.cohortId, drugConceptId });
          this.setupDrugSourceConceptOptions(res);
        } catch (e) {
          console.error(e);
        }
        this.filtersLoading(false);
      }
    }

    return BaseDrugUtilReport;
  }
);
