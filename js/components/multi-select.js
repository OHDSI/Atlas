define(
  [
    'knockout',
    'text!./multi-select.html',
		'lodash',
    'less!./multi-select.less',
    'extensions/bindings/multiSelect',
    'databindings/eventListenerBinding',
  ],
  function (ko, view, _) {
		
    function multiSelectFilter(params) {
			var self = this;

      self.multiple = params.multiple;
      self.options = params.options;
      self.selectedValues = ko.observableArray(params.selectedValues && params.selectedValues());
      self.selectedValue = params.selectedValue;
      self.selectedTextFormat = params.selectedTextFormat || 'count > 2';
      self.noneSelectedText = ko.i18n('components.multiSelect.noneSelectedText', 'Nothing selected');
      self.noneResultsText = ko.i18n('components.multiSelect.noneResultsText', 'No matches found for {0}');
      self.countSelectedText = ko.i18n('components.multiSelect.countSelectedText', '{0} items selected');

      self.optionVals = ko.computed(() => {
        return params.options().map(opt => opt.value);
      });

      self.optionsText = (val) => params.options().find(opt => opt.value === val).label;
			
			self.onSelectionComplete = function (data, context, event) {
				// only reset the param's selectedValues if the current selections are different
				if (params.multiple && !_.xor(params.selectedValues(), self.selectedValues()).length == 0) {
					params.selectedValues(self.selectedValues());
				}
			};

    }

    const component = {
      viewModel: multiSelectFilter,
      template: view
    };

    ko.components.register('multi-select', component);

    return component;
  });