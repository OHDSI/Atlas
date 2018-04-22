define(
  [
    'knockout',
    'text!./table-baseline-exposure.html',
    'utils/BemHelper',
    '../base-report',
    'less!./table-baseline-exposure.less',
  ],
  function (ko, view, BemHelper, BaseCostUtilReport) {

    const componentClass = 'table-baseline-exposure';
    const bemHelper = new BemHelper(componentClass);

    function tableBaselineExposure(params) {
      this.classes = bemHelper.run.bind(bemHelper);
      this.columns = [
        {
          title: 'Period start',
          data: 'periodStart',
          className: bemHelper.run('period-start'),
        },
        {
          title: 'Period end',
          data: 'periodEnd',
          className: bemHelper.run('period-end'),
        },
        {
          title: 'Person Count',
          data: 'personsCount',
          className: bemHelper.run('persons-count'),
          render: BaseCostUtilReport.formatFullNumber,
        },
        {
          title: 'Percent Persons',
          data: 'personsPct',
          className: bemHelper.run('persons-pct'),
          render: BaseCostUtilReport.formatPercents,
          yFormat: BaseCostUtilReport.formatPercents,
        },
        {
          title: 'Total Exposure in Years',
          data: 'exposureTotal',
          className: bemHelper.run('exposure-total'),
          render: BaseCostUtilReport.formatFullNumber,
        },
        {
          title: 'Percent Exposed',
          data: 'exposurePct',
          className: bemHelper.run('exposure-pct'),
          render: BaseCostUtilReport.formatPercents,
          yFormat: BaseCostUtilReport.formatPercents,
        },
        {
          title: 'Average Exposure Years per 1,000 persons',
          data: 'exposureAvg',
          className: bemHelper.run('exposure-avg'),
          render: BaseCostUtilReport.formatFullNumber,
        },
      ];
      this.dataList = params.dataList;
    }

    const component = {
      viewModel: tableBaselineExposure,
      template: view
    };

    ko.components.register('table-baseline-exposure', component);
    return component;
  });