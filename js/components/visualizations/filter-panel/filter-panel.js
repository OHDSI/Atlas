define(
  [
    'knockout',
    'text!components/visualizations/filter-panel/filter-panel.html',
    'less!components/visualizations/filter-panel/filter-panel.less',
    'components/visualizations/filter-panel/multi-select/multi-select'
  ],
  function (ko, view) {
    function filterPanel(params) {
      this.filterList = params.filterList;
      this.apply = params.apply;
      this.clear = () => this.filterList.forEach(filter => filter.selectedValues([]));
    }

    const component = {
      viewModel: filterPanel,
      template: view
    };

    ko.components.register('visualizations-filter-panel', component);
    return component;
});