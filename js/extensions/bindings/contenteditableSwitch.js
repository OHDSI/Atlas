define(['knockout'], function (ko) {
  ko.bindingHandlers.contenteditableSwitch = {
    init: function (element, valueAccessor) {
      ko.applyBindingsToNode(element, {
        attr: {
          contenteditable: valueAccessor()
        }
      });
    }
  };
});