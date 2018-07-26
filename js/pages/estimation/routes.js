define(
  (require, factory) => {
    function routes(appModel) {
      return {        
        '/estimation': () => {
          appModel.activePage(this.title);
          require(['cohort-comparison-browser'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('cohort-comparison-browser');
          });
        },
        '/estimation/:cohortComparisonId:': (cohortComparisonId) => {
          appModel.activePage(this.title);
          require(['cohort-comparison-manager', 'components/cohort-definition-browser', 'components/atlas.cohort-editor', 'cohort-comparison-print-friendly', 'cohort-comparison-r-code', 'cohort-comparison-multi-r-code'], function () {
            appModel.currentCohortComparisonId(+cohortComparisonId);
            appModel.componentParams = {
              currentCohortComparisonId: appModel.currentCohortComparisonId,
              currentCohortComparison: appModel.currentCohortComparison,
              dirtyFlag: appModel.currentCohortComparisonDirtyFlag,
            };
            appModel.currentView('cohort-comparison-manager');
          });
        },
      };
    }

    return routes;
  }
);