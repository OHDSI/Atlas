define(
  (require, factory) => {
    const { AuthorizedRoute } = require('providers/Route');
    function routes(appModel) {
      return {        
        '/cohortdefinitions': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['cohort-definitions', 'cohort-definition-manager', 'cohort-definition-browser'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('cohort-definitions');
          });
        }),
        '/cohortdefinition/:cohortDefinitionId:/?((\w|.)*)': new AuthorizedRoute((cohortDefinitionId, path) => {
          appModel.activePage(this.title);
          require(['cohortbuilder/CohortDefinition', 'components/atlas.cohort-editor', 'cohort-definitions', 'cohort-definition-manager', 'cohort-definition-browser', 'conceptset-editor', 'report-manager', 'explore-cohort', 'conceptset-list-modal'], function (CohortDefinition) {
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
        }),
        '/cohortdefinition/:cohortDefinitionId/conceptset/:conceptSetId/:mode:': new AuthorizedRoute((cohortDefinitionId, conceptSetId, mode) => {
          appModel.activePage(this.title);
          require(['report-manager', 'cohortbuilder/CohortDefinition', 'components/atlas.cohort-editor', 'cohort-definitions', 'cohort-definition-manager', 'cohort-definition-browser', 'conceptset-editor', 'explore-cohort'], function (CohortDefinition) {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('cohort-definition-manager');
            appModel.currentCohortDefinitionMode('conceptsets');
            appModel.loadCohortDefinition(cohortDefinitionId, conceptSetId, 'cohort-definition-manager', 'details');
          });
        }),
        '/reports': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['report-manager', 'cohort-definition-manager', 'cohort-definition-browser'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('report-manager');
          });
        }),
      };
    }

    return routes;
  }
);