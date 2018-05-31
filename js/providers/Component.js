define([
  'knockout',
  'utils/BemHelper',  
], function (
  ko,
  BemHelper
) {
  class Component {
    constructor() {
      const bemHelper = new BemHelper(this.componentName);
      this.classes = bemHelper.run.bind(bemHelper);
    }

    static build(viewModelClass) {
      const component = {
        viewModel: viewModelClass,
        template: viewModelClass.view,
      };
      viewModelClass.componentName = viewModelClass.name;
    
      ko.components.register(viewModelClass.name, component);
      return component;
    }
  }

  return Component;
});
