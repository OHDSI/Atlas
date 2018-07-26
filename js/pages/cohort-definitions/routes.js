define(
  (require, factory) => {
    function routes(appModel) {
      return {        
        '/cohortdefinitions': () => {
          appModel.activePage(this.title);
          require([
            './cohort-definitions',
            './cohort-definition-manager',
            'components/cohort-definition-browser',
          ], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('cohort-definitions');
          });
        },
        '/cohortdefinition/:cohortDefinitionId:/?((\w|.)*)': (cohortDefinitionId, path) => {
          appModel.activePage(this.title);
          require([
           'components/cohortbuilder/CohortDefinition',
            'components/atlas.cohort-editor',
            './cohort-definitions',
            './cohort-definition-manager',
            'components/cohort-definition-browser',
            'conceptset-editor',
            './components/reporting/cost-utilization/report-manager',
            'explore-cohort',
            'conceptset-list-modal',
          ], function () {
            // Determine the view to show on the cohort manager screen based on the path
            path = path.split("/");
            var view = 'definition'
            if (path.length > 0 && path[0] != "") {
              view = path[0];
            }
            // Determine any optional parameters to set based on the query string
            qs = appModel.router.qs(); // Get the query string parameters
            var sourceKey = qs.sourceKey || null;
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('cohort-definition-manager');
            appModel.currentCohortDefinitionMode(view);
            appModel.loadCohortDefinition(cohortDefinitionId, null, 'cohort-definition-manager', 'details', sourceKey);
          });
        },
        '/cohortdefinition/:cohortDefinitionId/conceptset/:conceptSetId/:mode:': (cohortDefinitionId, conceptSetId, mode) => {
          appModel.activePage(this.title);
          require([
           'components/cohortbuilder/CohortDefinition',
            'components/atlas.cohort-editor',
            './cohort-definitions',
            './cohort-definition-manager',
            'components/cohort-definition-browser',
            'conceptset-editor',
            './components/reporting/cost-utilization/report-manager',
            'explore-cohort',
          ], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('cohort-definition-manager');
            appModel.currentCohortDefinitionMode('conceptsets');
            appModel.loadCohortDefinition(cohortDefinitionId, conceptSetId, 'cohort-definition-manager', 'details');
          });
        },
        '/reports': () => {
          appModel.activePage(this.title);
          require([
            './components/reporting/cost-utilization/report-manager',
            './cohort-definition-manager',
            'components/cohort-definition-browser',
          ], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('report-manager');
          });
        },
      };
    }

    return routes;
  }
);