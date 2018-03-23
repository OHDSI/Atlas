define(
  [
    'knockout',
    'text!./multi-select.html',
    'less!./multi-select.less',
    'bindings/multiSelect',
  ],
  function (ko, view) {

    function multiSelectFilter(params) {
      this.multiple = params.multiple;
      this.options = params.options;
      this.selectedValues = params.selectedValues;
    }

    const component = {
      viewModel: multiSelectFilter,
      template: view
    };

    ko.components.register('visualizations-multi-select', component);
    return component;
  });