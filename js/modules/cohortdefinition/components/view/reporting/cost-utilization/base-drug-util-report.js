define(
  [
    'knockout',
    'text!./drug-util-detailed.html',
    './base-report',
    'appConfig',
    'utils/BemHelper',
    'appConfig',
    'modules/cohortdefinition/const',
    'modules/cohortdefinition/services/CohortResultsService',
    'components/visualizations/filter-panel/filter-panel',
    'less!./drug-util-detailed.less',
  ],
  function (ko, view, BaseCostUtilReport, appConfig, BemHelper, config, costUtilConst, CohortResultsService) {

    const DRUG_SOURCE_CONCEPT = 'drugSourceConcept';

    class BaseDrugUtilReport extends BaseCostUtilReport {

      constructor(componentName, params) {
        super(componentName, params);
        this.setupDrugSourceConceptOptions = this.setupDrugSourceConceptOptions.bind(this);

        this.window = params.window;

        this.filtersLoading = ko.observable(false);

        this.drugsTableColumns = [
          {
            title: 'Person Count',
            data: 'personsCount',
            className: this.classes('tbl-col', 'persons-count'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Total Records',
            data: 'exposureCount',
            className: this.classes('tbl-col', 'exposure-cnt'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Records per 1,000',
            data: 'exposuresPer1000',
            className: this.classes('tbl-col', 'exposures-per-1000'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Records per 1,000 with record',
            data: 'exposurePer1000WithExposures',
            className: this.classes('tbl-col', 'records-per-1000-with-records'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Records per 1,000 Per Year',
            data: 'exposurePer1000PerYear',
            className: this.classes('tbl-col', 'records-per-1000-per-year'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Total day supply (in days)',
            data: 'daysSupplyTotal',
            className: this.classes('tbl-col', 'total-days-supply'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Average Day Supply (in days)',
            data: 'daysSupplyAvg',
            className: this.classes('tbl-col', 'avg-days-supply'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Day Supply per 1,000 per year',
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
            title: 'Average Quantity',
            data: 'quantityAvg',
            className: this.classes('tbl-col', 'avg-quantity'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Quantity per 1,000 per year',
            data: 'quantityPer1000PerYear',
            className: this.classes('tbl-col', 'quantity-per-1000-per-year'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
        ];
      }

      getFilterList() {
        return [
          costUtilConst.getPeriodTypeFilter(),
          {
            type: 'select',
            label: 'Drug Source',
            name: DRUG_SOURCE_CONCEPT,
            options: ko.observableArray([]),
            selectedValue: ko.observable(null),
          },
        ];
      }

      setupDrugSourceConceptOptions(conceptList) {
        const filter = this.filterList.find(filter => filter.name === DRUG_SOURCE_CONCEPT);
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
