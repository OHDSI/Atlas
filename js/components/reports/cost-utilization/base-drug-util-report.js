define(
  [
    'knockout',
    'text!./drug-util-detailed.html',
    './base-report',
    'appConfig',
    'utils/BemHelper',
    'appConfig',
    './const',
    '../CohortResultsService',
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
          },
          {
            title: 'Total Records',
            data: 'exposureCount',
            className: this.classes('tbl-col', 'exposure-cnt'),
          },
          {
            title: 'Records per 1,000',
            data: 'exposuresPer1000',
            className: this.classes('tbl-col', 'exposures-per-1000'),
          },
          {
            title: 'Records per 1,000 with record',
            data: 'exposurePer1000WithExposures',
            className: this.classes('tbl-col', 'records-per-1000-with-records'),
          },
          {
            title: 'Records per 1,000 Per Year',
            data: 'exposurePer1000PerYear',
            className: this.classes('tbl-col', 'records-per-1000-per-year'),
          },
          {
            title: 'Total day supply (in days)',
            data: 'daysSupplyTotal',
            className: this.classes('tbl-col', 'total-days-supply'),
          },
          {
            title: 'Average Day Supply (in days)',
            data: 'daysSupplyAvg',
            className: this.classes('tbl-col', 'avg-days-supply'),
          },
          {
            title: 'Day Supply per 1,000 per year',
            data: 'daysSupplyPer1000PerYear',
            className: this.classes('tbl-col', 'days-supply-per-1000-per-year'),
          },
          {
            title: 'Total Quantity',
            data: 'quantityTotal',
            className: this.classes('tbl-col', 'total-quantity'),
          },
          {
            title: 'Average Quantity',
            data: 'quantityAvg',
            className: this.classes('tbl-col', 'avg-quantity'),
          },
          {
            title: 'Quantity per 1,000 per year',
            data: 'quantityPer1000PerYear',
            className: this.classes('tbl-col', 'quantity-per-1000-per-year'),
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

      async loadFilterOptions({ drugConceptId }) {
        this.filtersLoading(true);
        try {
          const res = await CohortResultsService.loadDrugTypesConcepts({ source: this.source, cohortId: this.cohortId, drugConceptId });
          this.setupDrugSourceConceptOptions(res);
        } catch (e) {
          console.log(e);
        }
        this.filtersLoading(false);
      }

      onDataLoaded({ data }) {
        this.dataList(data);
      }
    }

    return BaseDrugUtilReport;
  }
);
