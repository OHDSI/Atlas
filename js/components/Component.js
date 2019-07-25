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
      this.subscriptions = [];
      const bemHelper = new BemHelper(this.componentName);
      this.classes = bemHelper.run.bind(bemHelper);
      this.isAuthenticated = AuthAPI.isAuthenticated;
    }

    dispose() {
        this.subscriptions.forEach(sub => sub.dispose());
    }
  }

  return Component;
});
