define(
  [
    'knockout',
    'text!components/visualizations/table-baseline-exposure/table-baseline-exposure.html',
    'utils/BemHelper',
    'webapi/MomentAPI',
    'less!components/visualizations/table-baseline-exposure/table-baseline-exposure.less',
  ],
  function (ko, view, BemHelper, MomentAPI) {

    const componentClass = 'table-baseline-exposure';
    const bemHelper = new BemHelper(componentClass);

    const datestyle = 'D MMM Y';

    function tableBaselineExposure(params) {
      this.classes = bemHelper.run.bind(bemHelper);
      this.dataList = params.dataList.map(entry => ({
        ...entry,
        period: MomentAPI.formatDate(entry.periodStart, datestyle) + ' to ' + MomentAPI.formatDate(entry.periodEnd, datestyle),
      }));
    }

    const component = {
      viewModel: tableBaselineExposure,
      template: view
    };

    ko.components.register('table-baseline-exposure', component);
    return component;
  });