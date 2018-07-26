define(['knockout',
    'text!./users-import.html',
    'appConfig',
    'webapi/AuthAPI',
    'webapi/UsersAPI',
    'components/configuration/users-import/const',
    'less!./users-import.less'],
  function(ko, view, config, authApi, usersApi, Const) {

  function usersImport(params) {
    const self = this;
    self.loading = ko.observable();
    self.providers = ko.observable();
    self.isAuthenticated = authApi.isAuthenticated;
    self.hasMultipleProviders = ko.pureComputed(() => self.providers() && !!self.providers().ldapUrl && !!self.providers().adUrl);
    self.WIZARD_STEPS = Const.WIZARD_STEPS;
    self.wizardStep = ko.observable(self.WIZARD_STEPS.SOURCES);

    // form inputs
    self.importSource = ko.observable("ad");

    const transitions = {
      'sources': { next: self.WIZARD_STEPS.LOGIN, },
      'login': { prev: self.WIZARD_STEPS.SOURCES, next: self.WIZARD_STEPS.MAPPING, },
      'mapping': { prev: self.WIZARD_STEPS.LOGIN, }
    };

    function getStep(dir) {

      const direction = dir || 'next';
      const vertex = transitions[self.wizardStep()] || {};
      const value = vertex[direction];
      return (typeof value === 'function') ? value() : value;
    }

    self.hasPrevious = ko.computed(() => !!getStep('prev'));
    self.hasNext = ko.computed(() => !!getStep());

    self.nextStep = function() {
      const next = getStep();
      if (next) {
        self.wizardStep(next);
      }
    };

    self.prevStep = function () {
      const prev = getStep('prev');
      if (prev) {
        self.wizardStep(prev);
      }
    };

    function init() {
      self.loading(true);
      usersApi.getAuthenticationProviders().then(providers => {
        self.providers(providers);
        self.loading(false);
      });
    }
    init();
  }

  const component = {
    viewModel: usersImport,
    template: view,
  };

  ko.components.register('users-import', component);
  return component;
});