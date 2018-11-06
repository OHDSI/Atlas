define((require, factory) => {
  const { AuthorizedRoute } = require('pages/Route');
  const atlasState = require('atlas-state');
    function routes(appModel, router) {

      const ccaViewEdit = new AuthorizedRoute((estimationId, section) => {
        appModel.activePage(this.title);
        require(['./cca-manager'], function () {
          atlasState.estimationAnalysis.selectedId(estimationId);
          router.setCurrentView('cca-manager', {
            section: section || 'specification',
          });
        });
      });

      return {
        '/cca': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./cohort-comparison-browser'], function() {
            router.setCurrentView('cohort-comparison-browser');
          });
        }),
        '/cca/:cohortComparisonId:': new AuthorizedRoute((cohortComparisonId) => {
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
        '/estimation': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./estimation-browser'], function () {
            router.setCurrentView('estimation-browser');
          });
        }),
        '/estimation/cca/:estimationId:': ccaViewEdit,
        '/estimation/cca/:estimationId:/:section:': ccaViewEdit,
      };
    }

    return routes;
  }
);