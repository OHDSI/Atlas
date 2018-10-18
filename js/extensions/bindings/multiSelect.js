define(
  [
    'knockout',
    'bootstrap-select',
  ],
  function (ko) {
    ko.bindingHandlers.multiSelect = {
      init: function(element, valueAccessor, allBindings, data, context) {
        if (data.options) {
          data.options.subscribe(() => $(element).selectpicker('refresh'));
        }

        if (data.selectedValues) {
          data.selectedValues.subscribe(() => $(element).selectpicker('refresh'));
        }

        if (data.selectedValue) {
            data.selectedValue.subscribe(() => $(element).selectpicker('refresh'));
        }

        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
          $(element).selectpicker('destroy');
        });
      },
      update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        $(element).selectpicker(valueAccessor());
      }
    };
  }
);
