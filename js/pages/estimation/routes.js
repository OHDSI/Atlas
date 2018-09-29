define(
  (require, factory) => {
    const { AuthorizedRoute } = require('providers/Route');
    const atlasState = require('atlas-state');		
    function routes(appModel, router) {
      return {        
        '/estimation': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./estimation-browser'], function () {
            router.setCurrentView('estimation-browser');
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
        '/tempfe': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['featureextraction/components/TemporalCovariateSettingsEditor'], function () {
            appModel.currentView('temporal-covar-settings-editor');
          });
        }),
        '/estimation/cca/:estimationId:': new AuthorizedRoute((estimationId) => {
          appModel.activePage(this.title);
          require(['./cca-manager'], function () {
            const params = {};
            atlasState.estimationAnalysis.selectedId(estimationId);

            router.setCurrentView('cca-manager', params);
          });
        }),
      };
    }

    return routes;
  }
);