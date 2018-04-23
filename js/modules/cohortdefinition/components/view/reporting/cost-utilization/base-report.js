define(
  [
    'knockout',
    'utils/BemHelper',
    'appConfig',
    'components/visualizations/filter-panel/utils',
    'moment',
    'd3',
    'webapi/MomentAPI',
    'utils/CsvUtils',
    'numeral'
  ],
  function (ko, BemHelper, appConfig, filterPanelUtils, moment, d3, MomentAPI, CsvUtils, numeral) {

    class BaseCostUtilReport {

      constructor(componentName, params) {
        // Preserve context, because it can be lost during knockout handling
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

        const bemHelper = new BemHelper(componentName);
        this.classes = bemHelper.run.bind(bemHelper);
        this.loading = ko.observable(true);

        // Tabs

        this.visualizationTab = 0;
        this.rawDataTab = 1;
        this.tabLabels = {
          [this.visualizationTab]: 'Visualization',
          [this.rawDataTab]: 'Raw data',
        };
        this.currentTab = ko.observable(this.visualizationTab);

        // Filters and data

        this.filterList = this.getFilterList();
        this.dataList = ko.observableArray();

        // Charts formatters

        this.dateTickFormat = d3.timeFormat('%Y-%m-%d');
        this.emptyTickFormat = () => null;
        this.formatDate = val => MomentAPI.formatDate(val, 'D MMM Y'); // TODO: display interval
        this.formatRounded = d3.format(".0s");
      }

      static conceptsToOptions(conceptList) {
        return conceptList.map(el => ({ label: el.conceptName, value: el.conceptId }));
      }

      static formatFullNumber(val) {
        return numeral(val).format();
      }

      static formatPercents(val) {
        return numeral(val).format('0,0.00') + '%';
      }

      static getCostColumns() {
        return [
          {
            title: 'Allowed cost',
            data: 'allowed',
            className: this.classes('tbl-col', 'allowed'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Allowed cost PMPM',
            data: 'allowedPmPm',
            className: this.classes('tbl-col', 'allowed-pmpm'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Charged cost',
            data: 'charged',
            className: this.classes('tbl-col', 'charged'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Charged cost PMPM',
            data: 'chargedPmPm',
            className: this.classes('tbl-col', 'charged'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Paid cost',
            data: 'paid',
            className: this.classes('tbl-col', 'paid'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Paid cost PMPM',
            data: 'paidPmPm',
            className: this.classes('tbl-col', 'paid-pmpm'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Allowed/Charged',
            data: 'allowedChargedRatio',
            className: this.classes('tbl-col', 'allowed-charged-ratio'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Paid/Allowed',
            data: 'paidAllowedRatio',
            className: this.classes('tbl-col', 'paid-allowed-ratio'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
        ];
      }

      getTooltipBuilder(options) {
        return (d) => {
          let tipText = '';
          tipText += `Period: ${options.xFormat(d.xValue)} - ${options.xFormat(d.periodEnd)}</br>`;
          tipText += `${options.yLabel}: ${BaseCostUtilReport.formatFullNumber(d.yValue)}`;
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

      getSelectedFilterValues() {
        return filterPanelUtils.getSelectedFilterValues(this.filterList);
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
          yValue: parseFloat(entry[yValueField]),
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

      init() {
        this.loadData(this.getSelectedFilterValues());
      }

    }

    return BaseCostUtilReport;

  }
)
