define(
	(require, factory) => {
    const { AuthorizedRoute } = require('pages/Route');
    function routes(appModel, router) {
      return {        
        '/cohortdefinitions': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require([
            './cohort-definitions',
            './cohort-definition-manager',
            'components/cohort-definition-browser',
          ], function () {
            router.setCurrentView('cohort-definitions');
          });
        }),
        '/cohortdefinition/:cohortDefinitionId:/?((\w|.)*)': new AuthorizedRoute((cohortDefinitionId, path = 'definition') => {
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
            let view = 'definition';
            if (path.length > 0 && path[0] != "") {
              view = path[0];
            }
            // Determine any optional parameters to set based on the query string
            qs = router.qs(); // Get the query string parameters
            var sourceKey = qs.sourceKey || null;
            router.setCurrentView('cohort-definition-manager');
            appModel.currentCohortDefinitionMode(view);
            appModel.loadCohortDefinition(cohortDefinitionId, null, 'cohort-definition-manager', 'details', sourceKey);
          });
        }),
        '/cohortdefinition/:cohortDefinitionId/conceptset/:conceptSetId/:mode:': new AuthorizedRoute((cohortDefinitionId, conceptSetId, mode) => {
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
            router.setCurrentView('cohort-definition-manager');
            appModel.currentCohortDefinitionMode('conceptsets');
            appModel.loadCohortDefinition(cohortDefinitionId, conceptSetId, 'cohort-definition-manager', 'details');
          });
        }),
        '/reports': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require([
            './components/reporting/cost-utilization/report-manager',
            './cohort-definition-manager',
            'components/cohort-definition-browser',
          ], function () {
            router.setCurrentView('report-manager');
          });
        }),
      };
    }

    return routes;
  }
);