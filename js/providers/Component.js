define([
  'knockout',
  'utils/BemHelper',
  'services/AuthService',
], function (
  ko,
  BemHelper,
  AuthService
) {
  class Component {
    constructor() {
      const bemHelper = new BemHelper(this.componentName);
      this.classes = bemHelper.run.bind(bemHelper);
      this.isAuthenticated = AuthService.isAuthenticated;
    }
  }

  return Component;
});
