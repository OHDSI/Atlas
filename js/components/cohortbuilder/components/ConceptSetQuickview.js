define(["knockout", "text!./ConceptSetQuickviewTemplate.html"], function (
  ko,
  componentTemplate
) {
  function ConceptSetQuickviewModel(params) {
    var self = this;
    var excludesDefault = true;
    var descendantsDefault = true;
    var mappedDefault = true;

    self.conceptSet = ko.computed(() =>
      ko.utils.unwrapObservable(params.conceptSet)
    );

    // behaviors

    self.toggleExcludes = function () {
      self
        .conceptSet()
        .expression.items()
        .forEach((item) => item.isExcluded(excludesDefault));
      excludesDefault = !excludesDefault;
    };

    self.toggleDescendants = function () {
      self
        .conceptSet()
        .expression.items()
        .forEach((item) => item.includeDescendants(descendantsDefault));
      descendantsDefault = !descendantsDefault;
    };

    self.toggleMapped = function () {
      self
        .conceptSet()
        .expression.items()
        .forEach((item) => item.includeMapped(mappedDefault));
      mappedDefault = !mappedDefault;
    };
  }

  return {
    viewModel: ConceptSetQuickviewModel,
    template: componentTemplate,
  };
});
