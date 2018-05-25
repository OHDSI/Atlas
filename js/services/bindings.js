define(['knockout'], (ko, require, exports) => {

  class DataBindings {
    init() {
      ko.bindingHandlers.reference = this.reference();
    }

    reference() {
      // remembering reference to DOM object will help to get rid of id attributes
      return {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
          const setter = valueAccessor();
          setter(element);
        },
        update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
          const setter = valueAccessor();
          setter(element);
        },
      };
    }
  }

  return new DataBindings();
})
