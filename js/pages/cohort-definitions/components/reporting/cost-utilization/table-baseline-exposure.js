define(
  [
    'knockout',
    'text!./table-baseline-exposure.html',
    'pages/cohort-definitions/components/reporting/cost-utilization/base-report',
    'utils/CommonUtils',
    'less!./table-baseline-exposure.less',
  ],
  function (
    ko,
    view,
    BaseCostUtilReport,
    commonUtils
  ) {

    const componentName = 'table-baseline-exposure';

    class TableBaselineExposure extends BaseCostUtilReport {
      constructor(params) {
        super(params);
        this.columns = [
          {
            title: 'Period start',
            data: 'periodStart',
            className: this.classes('period-start'),
          },
          {
            title: 'Period end',
            data: 'periodEnd',
            className: this.classes('period-end'),
          },
          {
            title: 'Person Count',
            data: 'personsCount',
            className: this.classes('persons-count'),
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Percent Persons',
            data: 'personsPct',
            className: this.classes('persons-pct'),
            render: BaseCostUtilReport.formatPercents,
            yFormat: BaseCostUtilReport.formatPercents,
          },
          {
            title: 'Total Exposure in Years',
            data: 'exposureTotal',
            className: this.classes('exposure-total'),
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Percent Exposed',
            data: 'exposurePct',
            className: this.classes('exposure-pct'),
            render: BaseCostUtilReport.formatPercents,
            yFormat: BaseCostUtilReport.formatPercents,
          },
          {
            title: 'Average Exposure Years per 1,000 persons',
            data: 'exposureAvg',
            className: this.classes('exposure-avg'),
            render: BaseCostUtilReport.formatFullNumber,
          },
        ];
        this.dataList = params.dataList;
      }
    }

    return commonUtils.build(componentName, TableBaselineExposure, view);
  });