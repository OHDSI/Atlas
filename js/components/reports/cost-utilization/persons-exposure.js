define(
  [
    'knockout',
    'text!./persons-exposure.html',
    './base-report',
    'appConfig',
    'atlascharts',
    'utils/BemHelper',
    'appConfig',
    './const',
    'bindings/lineChart',
    'components/visualizations/filter-panel/filter-panel',
    'components/visualizations/table-baseline-exposure/table-baseline-exposure',
    'less!./persons-exposure.less',
  ],
  function (ko, view, BaseCostUtilReport, appConfig, atlascharts, BemHelper, config, costUtilConst) {

    const componentName = 'cost-utilization-persons-exposure';

    class PersonAndExposureReport extends BaseCostUtilReport {

      constructor(params) {
        super(componentName, params);

        this.mode = params.mode;

        this.summary = {
          personsCount: ko.observable(0),
          exposureTotal: ko.observable(0),
          exposureAvg: ko.observable(0),
        };

        this.setupChartsData();

        this.init();
      }

      getFilterList() {
        return [
          costUtilConst.getPeriodTypeFilter(),
        ];
      }

      buildSearchUrl() {
        return `${appConfig.api.url}cohortresults/${this.source}/${this.cohortId}/healthcareutilization/exposure/${this.mode}`;
      }

      onDataLoaded({ summary, data }) {
        this.summary.personsCount(summary.personsCount);
        this.summary.exposureTotal(summary.exposureTotal);
        this.summary.exposureAvg(summary.exposureAvg);
        this.dataList(data);
      }

      setupChartsData() {

        this.personsChartData = this.createChartDataObservable('personsCount');
        this.totalExposureChartData = this.createChartDataObservable('exposureTotal');
        this.avgExposurePerPersonChartData = this.createChartDataObservable('exposureAvg');
      }
    }

    const component = {
      viewModel: PersonAndExposureReport,
      template: view
    };

    ko.components.register(componentName, component);
    return component;
  }
);
