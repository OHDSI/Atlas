define(
  [
    'knockout',
    'text!./persons-exposure.html',
    'pages/cohort-definitions/components/reporting/cost-utilization/base-report',
    'pages/cohort-definitions/const',
    'services/CohortResults',
    'utils/CommonUtils',
    'components/visualizations/filter-panel/filter-panel',
    'pages/cohort-definitions/components/reporting/cost-utilization/table-baseline-exposure',
    'less!./persons-exposure.less',
    'components/visualizations/line-chart',
  ],
  function 
  (ko,
    view,
    BaseCostUtilReport,
    costUtilConst,
    CohortResultsService,
    commonUtils
  ) {

    const componentName = 'cost-utilization-persons-exposure';

    class PersonAndExposureReport extends BaseCostUtilReport {

      constructor(params) {
        super(params);

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

    return commonUtils.build(componentName, PersonAndExposureReport, view);
  }
);
