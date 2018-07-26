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
  }

  return Component;
});
