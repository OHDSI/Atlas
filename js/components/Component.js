define([
  'knockout',
  'utils/BemHelper',
  'services/AuthAPI',
], function (
  ko,
  BemHelper,
  AuthAPI
) {
  class Component {
    constructor() {
      const bemHelper = new BemHelper(this.componentName);
      this.classes = bemHelper.run.bind(bemHelper);
      this.isAuthenticated = AuthAPI.isAuthenticated;
    }
  }

  return Component;
});
