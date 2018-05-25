define([
  'knockout',
  'utils/BemHelper',  
], function (
  ko,
  BemHelper
) {
  class Component {
    constructor() {
      this.classes = null;
      this.view = null;
      this.createViewModel = this.createViewModel.bind(this);
    }

    render(params) {
      const bemHelper = new BemHelper(this.name);
      this.classes = bemHelper.run.bind(bemHelper);
    }

    createViewModel(params, info) {
      return this.render(params, info);
    }

    build() {
      const component = {
        viewModel: this,
        template: this.view,
      };
    
      ko.components.register(this.name, component);
      return component;
    }
  }

  return Component;
});
