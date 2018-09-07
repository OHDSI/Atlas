define(
  (require, factory) => {
    const { AuthorizedRoute } = require('providers/Route');
    function routes(appModel, router) {
      return {        
        '/estimation': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['cohort-comparison-browser'], function () {
            router.setCurrentView('cohort-comparison-browser');
          });
        }),
        '/estimation/:cohortComparisonId:': new AuthorizedRoute((cohortComparisonId) => {
          appModel.activePage(this.title);
          require(['cohort-comparison-manager', 'components/cohort-definition-browser', 'components/atlas.cohort-editor', 'cohort-comparison-print-friendly', 'cohort-comparison-r-code', 'cohort-comparison-multi-r-code'], function () {
            appModel.currentCohortComparisonId(+cohortComparisonId);
            router.setCurrentView('cohort-comparison-manager', {
              currentCohortComparisonId: appModel.currentCohortComparisonId,
              currentCohortComparison: appModel.currentCohortComparison,
              dirtyFlag: appModel.currentCohortComparisonDirtyFlag,
            });
          });
        }),
      };
    }

    return routes;
  }
);