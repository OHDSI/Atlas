define(['knockout'], function (ko) {
  ko.bindingHandlers.placeholder = {
    init: function (element, valueAccessor) {
      ko.applyBindingsToNode(element, { attr: { placeholder: valueAccessor() } } );
    }
  }
});