define(
	[
    'pages/Route',
    'atlas-state'
	],
	({ AuthorizedRoute }, atlasState) => {
    function routes(appModel, router) {
      return {        
        '/estimation': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['pages/estimation/estimation-browser'], function () {
            router.setCurrentView('estimation-browser');
          });
        }),
        '/estimation/:cohortComparisonId:': new AuthorizedRoute((cohortComparisonId) => {
          appModel.activePage(this.title);
          require([
            'pages/estimation/cohort-comparison-manager',
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
          require(['featureextraction/components/CovariateSettingsEditor'], function () {
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
          require(['pages/estimation/cca-manager'], function () {
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