define(
  [
    'knockout',
    'text!./multi-select.html',
    'less!./multi-select.less',
    'extensions/bindings/multiSelect',
  ],
  function (ko, view) {

    function multiSelectFilter(params) {
      this.multiple = params.multiple;
      this.options = params.options;
      this.selectedValues = params.selectedValues;
      this.selectedValue = params.selectedValue;
      this.selectedTextFormat = params.selectedTextFormat || 'count > 2';

      this.optionVals = ko.computed(() => {
        return params.options().map(opt => opt.value);
      });

      this.optionsText = (val) => params.options().find(opt => opt.value === val).label;
    }

    const component = {
      viewModel: multiSelectFilter,
      template: view
    };

    ko.components.register('multi-select', component);

    return component;
  });