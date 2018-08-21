define(
  (require, factory) => {
    const { AuthorizedRoute } = require('providers/Route');

    function routes(appModel, router) {
      return {        
        '/estimation': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./cohort-comparison-browser'], function () {
            router.setCurrentView('cohort-comparison-browser');
          });
        }),
        '/estimation/:cohortComparisonId:': new AuthorizedRoute((cohortComparisonId) => {
          appModel.activePage(this.title);
          require([
            './cohort-comparison-manager',
            'components/cohort-definition-browser',
            'components/atlas.cohort-editor',
            'components/cohort-comparison-print-friendly',
            'components/cohort-comparison-r-code',
            'components/cohort-comparison-multi-r-code'
          ], function () {
            appModel.currentCohortComparisonId(+cohortComparisonId);

            const params = {};
            params.currentCohortComparisonId = appModel.currentCohortComparisonId();
            params.currentCohortComparison = appModel.currentCohortComparison();
            params.dirtyFlag = appModel.currentCohortComparisonDirtyFlag();

            router.setCurrentView('cohort-comparison-manager', params);
          });
        }),
        '/fe': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['components/featureextraction/components/CovariateSettingsEditor'], function () {
            appModel.currentView('covar-settings-editor');
          });
        }),
       '/est': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./cca-manager'], function () {
            appModel.currentView('cca-manager');
          });
        }),
      };
    }

    return routes;
  }
);