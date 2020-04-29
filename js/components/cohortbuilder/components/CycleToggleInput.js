define(["knockout", "text!./CycleToggleInputTemplate.html"], function (
  ko,
  template
) {
  function CycleToggleInputViewModel(params) {
    var self = this;

    function getOptionIndex(value, options) {
      return value == null
        ? 0
        : options.indexOf(
            self.options.filter((option) => option.value === value)[0]
          );
    }

    self.value = params.value;
    self.options = params.options;

    self.currentIndex = ko.pureComputed(() =>
      getOptionIndex(self.value(), self.options)
    );
    self.selectedOptionText = ko.pureComputed(function () {
      return ko.unwrap(self.options[self.currentIndex()].name);
    });

    self.nextOption = function () {
      var nextIndex = (self.currentIndex() + 1) % self.options.length;
      self.value(self.options[nextIndex].value);
    };
  }

  // return compoonent definition
  return {
    viewModel: CycleToggleInputViewModel,
    template: template,
  };
});
