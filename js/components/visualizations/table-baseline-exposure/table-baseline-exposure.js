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
      this.dataList = params.dataList;
    }

    const component = {
      viewModel: tableBaselineExposure,
      template: view
    };

    ko.components.register('table-baseline-exposure', component);
    return component;
  });