define(
  [
    'knockout',
    'text!components/visualizations/table-baseline-exposure/table-baseline-exposure.html',
    'utils/BemHelper',
    'less!components/visualizations/table-baseline-exposure/table-baseline-exposure.less',
  ],
  function (ko, view, BemHelper) {

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
        },
        {
          title: 'Percent Persons',
          data: 'personsPct',
          className: bemHelper.run('persons-pct'),
        },
        {
          title: 'Total Exposure in Years',
          data: 'exposureTotal',
          className: bemHelper.run('exposure-total'),
        },
        {
          title: 'Percent Exposed',
          data: 'exposurePct',
          className: bemHelper.run('exposure-pct'),
        },
        {
          title: 'Average Exposure per 1,000 persons',
          data: 'exposureAvg',
          className: bemHelper.run('exposure-avg'),
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