define([
  "knockout",
  "../options",
  "text!./WindowInputTemplate.html",
  "databindings",
], function (ko, options, template) {
  function WindowInputViewModel(params) {
    var self = this;
    self.options = options;
    self.Window = ko.utils.unwrapObservable(params.Window); // this will be a Window input type.
  }

  // return compoonent definition
  return {
    viewModel: WindowInputViewModel,
    template: template,
  };
});
