define([
  'knockout',
  'utils/BemHelper',  
], function (
  ko,
  BemHelper
) {
  class Component {
    constructor() {
      this.createViewModel = this.createViewModel.bind(this);
    }

    render(params) {
      const bemHelper = new BemHelper(this.name);
      this.classes = bemHelper.run.bind(bemHelper);
    }

    createViewModel(params, info) {
      return this.render(params, info);
    }
  }

  return Component;
});
