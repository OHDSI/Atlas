define(['knockout',
  'text!./ir-browser.html',
  'appConfig',
  'webapi/IRAnalysisAPI',
  'webapi/AuthAPI',
  'access-denied',
  'faceted-datatable',
  'iranalysis'
], function (ko, view, config, iraAPI, authApi) {
  function irBrowser(params) {
    var self = this;
    self.loading = ko.observable(false);
    self.config = config;
    self.analysisList = ko.observableArray();

    self.refresh = function () {
      self.loading(true);
      iraAPI.getAnalysisList().then(function (result) {
        self.analysisList(result);
        self.loading(false);
      });
    };
    self.isAuthenticated = authApi.isAuthenticated;
    self.canReadIRs = ko.pureComputed(function () {
      return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedReadIRs()) || !config.userAuthenticationEnabled;
    });
    self.canCreateIR = ko.pureComputed(function () {
      return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedCreateIR()) || !config.userAuthenticationEnabled;
    });

    self.onAnalysisSelected = function (d) {
      document.location = '#/iranalysis/' + d.id;
    };

    self.newAnalysis = function () {
      document.location = "#/iranalysis/new";
    };

    // startup actions
    self.refresh();
  }

  var component = {
    viewModel: irBrowser,
    template: view
  };

  ko.components.register('ir-browser', component);
  return component;
});