define(
  [
    'knockout',
    'components/Component',
    'appConfig',
    'components/visualizations/filter-panel/utils',
    'moment',
    'd3',
    'services/MomentAPI',
    'utils/CsvUtils',
    'utils/CommonUtils',
    'numeral',
    'services/CohortResults',
    'lodash'
  ],
  function (
    ko,
    Component,
    appConfig,
    filterPanelUtils,
    moment,
    d3,
    MomentAPI,
    CsvUtils,
    commonUtils,
    numeral
  , CohortResultsService, lodash) {

    class BaseCostUtilReport extends Component {

      constructor(params) {
        // Preserve context, because it can be lost during knockout handling
        super(params);
        this.getFilterList = this.getFilterList.bind(this);
        this.loadData = this.loadData.bind(this);
        this.getSelectedFilterValues = this.getSelectedFilterValues.bind(this);
        this.applyFilters = this.applyFilters.bind(this);
        this.createChartData = this.createChartData.bind(this);
        this.createChartDataObservable = this.createChartDataObservable.bind(this);
        this.init = this.init.bind(this);
        this.buildSearchUrl = this.buildSearchUrl.bind(this);
        this.saveAsCsv = this.saveAsCsv.bind(this);
        this.setupChartsData = this.setupChartsData.bind(this);

        this.enableCosts = appConfig.enableCosts;

        // Input params

        this.source = params.source();
        this.cohortId = params.cohortId();

        // Styling

        this.loading = ko.observable(true);

        // Tabs

        this.visualizationTab = 0;
        this.rawDataTab = 1;
        this.tabLabels = {
          [this.visualizationTab]: ko.unwrap(ko.i18n('cohortDefinitions.costUtilization.visualization', 'Visualization')),
          [this.rawDataTab]: ko.unwrap(ko.i18n('cohortDefinitions.costUtilization.rawData', 'Raw data')),
        };
        this.currentTab = ko.observable(this.visualizationTab);

        // Data

        this.filterList = ko.observableArray([]);
        this.dataList = ko.observableArray([]);

        // Charts formatters

        this.dateTickFormat = d3.timeFormat('%Y-%m-%d');
        this.emptyTickFormat = () => null;
        this.formatDate = val => MomentAPI.formatDate(val, 'D MMM Y'); // TODO: display interval
        this.formatRounded = d3.format(".0s");
        this.tableOptions = commonUtils.getTableOptions('M');
      }

      static conceptsToOptions(conceptList) {
        return lodash.sortBy(
            conceptList.map(el => ({ label: el.conceptName, value: el.conceptId })),
            ['label']
        );
      }

      static formatFullNumber(val) {
        return numeral(val).format();
      }

      static formatPreciseNumber(val) {
        return numeral(val).format('0,0.00');
      }

      static formatPercents(val) {
        return numeral(val).format('0,0.00') + '%';
      }

      getCostColumns() {
        return [
          {
            title: ko.i18n('columns.allowed', 'Allowed cost'),
            data: 'allowed',
            className: this.classes('tbl-col', 'allowed'),
            showInChart: true,
            render: BaseCostUtilReport.formatPreciseNumber,
          },
          {
            title: ko.i18n('columns.allowedPmPm', 'Allowed cost PMPM'),
            data: 'allowedPmPm',
            className: this.classes('tbl-col', 'allowed-pmpm'),
            showInChart: true,
            render: BaseCostUtilReport.formatPreciseNumber,
          },
          {
            title: ko.i18n('columns.charged', 'Charged cost'),
            data: 'charged',
            className: this.classes('tbl-col', 'charged'),
            showInChart: true,
            render: BaseCostUtilReport.formatPreciseNumber,
          },
          {
            title: ko.i18n('columns.chargedPmPm', 'Charged cost PMPM'),
            data: 'chargedPmPm',
            className: this.classes('tbl-col', 'charged'),
            showInChart: true,
            render: BaseCostUtilReport.formatPreciseNumber,
          },
          {
            title: ko.i18n('columns.paid', 'Paid cost'),
            data: 'paid',
            className: this.classes('tbl-col', 'paid'),
            showInChart: true,
            render: BaseCostUtilReport.formatPreciseNumber,
          },
          {
            title: ko.i18n('columns.paidPmPm', 'Paid cost PMPM'),
            data: 'paidPmPm',
            className: this.classes('tbl-col', 'paid-pmpm'),
            showInChart: true,
            render: BaseCostUtilReport.formatPreciseNumber,
          },
          {
            title: ko.i18n('columns.allowedChargedRatio', 'Allowed /Charged'),
            data: 'allowedChargedRatio',
            className: this.classes('tbl-col', 'allowed-charged-ratio'),
            showInChart: true,
            render: BaseCostUtilReport.formatPreciseNumber,
          },
          {
            title: ko.i18n('columns.paidAllowedRatio', 'Paid /Allowed'),
            data: 'paidAllowedRatio',
            className: this.classes('tbl-col', 'paid-allowed-ratio'),
            showInChart: true,
            render: BaseCostUtilReport.formatPreciseNumber,
          },
        ];
      }

      getTooltipBuilder(options) {
        return (d) => {
          let tipText = '';
          tipText += `Period: ${options.xFormat(d.xValue)} - ${options.xFormat(d.periodEnd)}</br>`;
          tipText += `${options.yLabel}: ${BaseCostUtilReport.formatPreciseNumber(d.yValue)}`;
          return tipText;
        };
      };

      getFilterList() {
        throw new Error('Should be overriden!');
      }

      buildSearchUrl() {
        throw new Error('Should be overriden!');
      }

      async loadData(filters) {
        this.loading(true);
        try {
          const res = await this.fetchAPI({ filters });
        } catch (e) {
          console.error(e);
        }
        this.loading(false);
      }
      
      async initializePeriods() {
        try {
          this.periods = await CohortResultsService.loadPeriods({ source: this.source, cohortId: this.cohortId, window: this.window });
        } catch (e) {
          console.error(e);
        }
      }

      getSelectedFilterValues() {
        return filterPanelUtils.getSelectedFilterValues(this.filterList());
      }

      applyFilters() {
        this.loadData(this.getSelectedFilterValues());
      }

      saveAsCsv() {
        CsvUtils.saveAsCsv(this.dataList());
      }

      createChartData(yValueField) {
        return this.dataList().map((entry, idx) => ({
          id: idx,
          xValue: moment(entry.periodStart).toDate(),
          periodEnd: moment(entry.periodEnd).toDate(),
          yValue: parseFloat(entry[yValueField]) || 0,
        }));
      }

      createChartDataObservable(yValueField) {
        return ko.computed(() => this.createChartData(yValueField));
      }

      setupChartsData(lines) {
        this.chartDataList = ko.computed(() =>
          lines
            .map(line => ({
              name: line.title,
              values: this.createChartDataObservable(line.data),
              visible: ko.computed(() => this.displayedCharts().includes(line.title)),
              yFormat: line.yFormat,
            }))
        );
      }

      async init() {
        await this.initializePeriods();
        await this.filterList(this.getFilterList());
        await this.loadData(this.getSelectedFilterValues());
      }

    }

    return BaseCostUtilReport;

  }
)
