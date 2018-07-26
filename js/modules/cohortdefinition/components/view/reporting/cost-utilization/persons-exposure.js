define(
  [
    'knockout',
    'text!./persons-exposure.html',
    './base-report',
    'modules/cohortdefinition/const',
    'modules/cohortdefinition/services/CohortResultsService',
    'components/visualizations/filter-panel/filter-panel',
    'modules/cohortdefinition/components/view/reporting/cost-utilization/table-baseline-exposure/table-baseline-exposure',
    'less!./persons-exposure.less',
    'components/visualizations/line-chart',
  ],
  function (ko, view, BaseCostUtilReport, costUtilConst, CohortResultsService) {

    const componentName = 'cost-utilization-persons-exposure';

    class PersonAndExposureReport extends BaseCostUtilReport {

      constructor(params) {
        super(componentName, params);

        this.window = params.window;

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
          costUtilConst.getPeriodTypeFilter(this.periods),
        ];
      }

      fetchAPI({ filters }) {
        return CohortResultsService.loadPersonExposureReport({
            source: this.source,
            cohortId: this.cohortId,
            window: this.window,
            filters,
          })
          .then(({ summary, data }) => {
            this.summary.personsCount(BaseCostUtilReport.formatFullNumber(summary.personsCount));
            this.summary.exposureTotal(BaseCostUtilReport.formatFullNumber(summary.exposureTotal));
            this.summary.exposureAvg(BaseCostUtilReport.formatFullNumber(summary.exposureAvg));
            this.dataList(data);
          });
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
