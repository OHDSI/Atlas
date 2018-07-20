define([
  'knockout',
  'text!./ir-browser.html',
  'appConfig',
  'webapi/IRAnalysisAPI',
  'webapi/AuthAPI',
  'providers/Component',
  'utils/commonUtils',
  './const',
  'components/ac-access-denied',
  'faceted-datatable',
  './components/iranalysis/main',
  'components/heading',
], function (
  ko,
  view,
  config,
  iraAPI,
  authApi,
  Component,
  commonUtils,
  constants
) {
  class IRBrowser extends Component {
    constructor(params) {
      super(params);      
      this.loading = ko.observable(false);
      this.config = config;
      this.analysisList = ko.observableArray();
      this.isAuthenticated = authApi.isAuthenticated;
      this.canReadIRs = ko.pureComputed(() => {
        return (config.userAuthenticationEnabled && this.isAuthenticated() && authApi.isPermittedReadIRs()) || !config.userAuthenticationEnabled;
      });
      this.canCreateIR = ko.pureComputed(() => {
        return (config.userAuthenticationEnabled && this.isAuthenticated() && authApi.isPermittedCreateIR()) || !config.userAuthenticationEnabled;
      });
      
      // startup actions
      this.refresh();
    }

    refresh() {
      this.loading(true);
      iraAPI
        .getAnalysisList()
        .then((result) => {
          this.analysisList(result);
          this.loading(false);
        });
    };

    onAnalysisSelected(d) {
      document.location = constants.apiPaths.analysis(d.id);
    };

    newAnalysis() {
      document.location = constants.apiPaths.createAnalysis();
    };

  }

  return commonUtils.build('ir-browser', IRBrowser, view);
});