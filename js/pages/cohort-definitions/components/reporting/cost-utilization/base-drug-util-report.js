define(
  [
    'knockout',
    'text!./drug-util-detailed.html',
    'pages/cohort-definitions/components/reporting/cost-utilization/base-report',
    'appConfig',
    'utils/BemHelper',
    'utils/CommonUtils',
    'appConfig',
    'pages/cohort-definitions/const',
    'services/CohortResults',
    'components/visualizations/filter-panel/filter-panel',
    'less!./drug-util-detailed.less',
  ],
  function (ko, view, BaseCostUtilReport, appConfig, BemHelper, commonUtils, config, costUtilConst, CohortResultsService) {

    const DRUG_SOURCE_TYPE = 'drugType';

    class BaseDrugUtilReport extends BaseCostUtilReport {

      constructor(params) {
        super(params);
        this.setupDrugSourceConceptOptions = this.setupDrugSourceConceptOptions.bind(this);

        this.window = params.window;

        this.filtersLoading = ko.observable(false);

        this.drugsTableColumns = [
          {
            title: ko.i18n('columns.personsCount', 'Persons'),
            data: 'personsCount',
            className: this.classes('tbl-col', 'persons-count'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: ko.i18n('columns.visitsCount', 'Records'),
            data: 'exposureCount',
            className: this.classes('tbl-col', 'exposure-cnt'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: ko.i18n('columns.visitsPer1000', 'Records/1K'),
            data: 'exposuresPer1000',
            className: this.classes('tbl-col', 'exposures-per-1000'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: ko.i18n('columns.visitsPer1000WithVisits', 'Records/1K +record'),
            data: 'exposurePer1000WithExposures',
            className: this.classes('tbl-col', 'records-per-1000-with-records'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: ko.i18n('columns.visitsPer1000PerYear', 'Records/1K/Year'),
            data: 'exposurePer1000PerYear',
            className: this.classes('tbl-col', 'records-per-1000-per-year'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: ko.i18n('columns.daysSupplyTotal', 'Days of Supply'),
            data: 'daysSupplyTotal',
            className: this.classes('tbl-col', 'total-days-supply'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: ko.i18n('columns.daysSupplyAvg', 'Avg. Days of Supply'),
            data: 'daysSupplyAvg',
            className: this.classes('tbl-col', 'avg-days-supply'),
            showInChart: true,
            render: BaseCostUtilReport.formatPreciseNumber,
          },
          {
            title: ko.i18n('columns.daysSupplyPer1000PerYear', 'Days of Supply /1K /Year'),
            data: 'daysSupplyPer1000PerYear',
            className: this.classes('tbl-col', 'days-supply-per-1000-per-year'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: ko.i18n('columns.quantityTotal', 'Total Quantity'),
            data: 'quantityTotal',
            className: this.classes('tbl-col', 'total-quantity'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: ko.i18n('columns.quantityAvg', 'Avg. Quantity'),
            data: 'quantityAvg',
            className: this.classes('tbl-col', 'avg-quantity'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: ko.i18n('columns.quantityPer1000PerYear', 'Quantity /1K /Year'),
            data: 'quantityPer1000PerYear',
            className: this.classes('tbl-col', 'quantity-per-1000-per-year'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          ...(appConfig.enableCosts ? this.getCostColumns() : []),
        ];

        this.tableOptions = commonUtils.getTableOptions('M');
      }

      getFilterList() {
        return [
          costUtilConst.getPeriodTypeFilter(this.periods),
          {
            type: 'select',
            label: ko.i18n('options.drugSource', 'Drug Source'),
            name: DRUG_SOURCE_TYPE,
            options: ko.observableArray([]),
            selectedValue: ko.observable(null),
          },
        ];
      }

      setupDrugSourceConceptOptions(conceptList) {
        const filter = this.filterList().find(filter => filter.name === DRUG_SOURCE_TYPE);
        filter.options([
          { label: ko.i18n('options.allDrugSources', 'All drug sources'), value: null },
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
