define(
  [
    'knockout',
    'text!components/visualizations/filter-panel/multi-select/multi-select.html',
    'less!components/visualizations/filter-panel/multi-select/multi-select.less',
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.13.0-beta/js/bootstrap-select.js',
    'css!https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.13.0-beta/css/bootstrap-select.min.css',
  ],
  function (ko, view) {

    ko.bindingHandlers.multiSelect = {
      init: function(element, valueAccessor, allBindings, data, context) {
        let $select;

        setTimeout(
          () => $select = $(element).selectpicker(valueAccessor()),
          0
        );

        data.selectedValues.subscribe(() => $select.selectpicker('refresh'));

        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
          $select.selectpicker('destroy');
        });
      }
    };

    function multiSelectFilter(params) {
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