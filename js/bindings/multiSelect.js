define(
  [
    'knockout',
    'bootstrap-select',
    'css!bootstrap-select-css',
  ],
  function (ko) {
    ko.bindingHandlers.multiSelect = {
      init: function(element, valueAccessor, allBindings, data, context) {
        let $select;

        setTimeout(
          () => $select = $(element).selectpicker(valueAccessor()),
          0
        );

        if (data.selectedValues) {
          data.selectedValues.subscribe(() => $select.selectpicker('refresh'));
        }

        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
          if ($select) {
            $select.selectpicker('destroy');
          }
        });
      }
    };
  }
);
