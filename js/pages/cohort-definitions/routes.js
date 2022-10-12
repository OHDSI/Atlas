define(
	(require, factory) => {
    const { AuthorizedRoute } = require('pages/Route');
    const sharedState = require('atlas-state');
    const globalConstants = require('const');
    function routes(router) {
      return {
        '/cohortdefinitions': new AuthorizedRoute(() => {
          require([
            './cohort-definitions',
            './cohort-definition-manager',
            'components/entityBrowsers/cohort-definition-browser',
          ], function () {
            router.setCurrentView('cohort-definitions');
          });
        }),

      '/cohortdefinition/:cohortDefinitionId/samples': new AuthorizedRoute(
        cohortDefinitionId => {
          require([
            'components/conceptset/ConceptSetStore',
            'components/cohortbuilder/CohortDefinition',
            'components/atlas.cohort-editor',
            './cohort-definitions',
            './cohort-definition-manager',
            'components/entityBrowsers/cohort-definition-browser',
            'conceptset-editor',
            './components/reporting/cost-utilization/report-manager',
            'components/explore-cohort',
          ], function() {
            // not re-render component if it was rendered already
            router.setCurrentView('cohort-definition-manager', {
              cohortDefinitionId,
              mode: 'samples',
            })
            sharedState.CohortDefinition.mode('samples')
          })
        }
      ),

      '/cohortdefinition/:cohortDefinitionId/samples/:sourceKey': new AuthorizedRoute(
        (cohortDefinitionId, sourceKey) => {
          require([
            'components/cohortbuilder/CohortDefinition',
            'components/atlas.cohort-editor',
            './cohort-definitions',
            './cohort-definition-manager',
            'components/entityBrowsers/cohort-definition-browser',
            'conceptset-editor',
            './components/reporting/cost-utilization/report-manager',
            'components/explore-cohort',
          ], function() {
            router.setCurrentView('cohort-definition-manager', {
              cohortDefinitionId,
              sourceKey,
              mode: 'samples',
            })
            sharedState.CohortDefinition.mode('samples')
          })
        }
      ),

      '/cohortdefinition/:cohortDefinitionId/samples/:sourceKey/:sampleId': new AuthorizedRoute(
        (cohortDefinitionId, sourceKey, sampleId) => {
          require([
            'components/cohortbuilder/CohortDefinition',
            'components/atlas.cohort-editor',
            './cohort-definitions',
            './cohort-definition-manager',
            'components/entityBrowsers/cohort-definition-browser',
            'conceptset-editor',
            './components/reporting/cost-utilization/report-manager',
            'components/explore-cohort',
          ], function() {
            router.setCurrentView('cohort-definition-manager', {
              cohortDefinitionId,
              sampleId,
              sourceKey,
              mode: 'samples',
            })
            sharedState.CohortDefinition.mode('samples')
          })
        }
      ),

      '/cohortdefinition/:cohortDefinitionId/conceptsets/:conceptSetId/:mode': new AuthorizedRoute(
        (cohortDefinitionId, conceptSetId, mode) => {
          require([
            'components/conceptset/ConceptSetStore',
            'components/cohortbuilder/CohortDefinition',
            'components/atlas.cohort-editor',
            './cohort-definitions',
            './cohort-definition-manager',
            'components/entityBrowsers/cohort-definition-browser',
            'conceptset-editor',
            './components/reporting/cost-utilization/report-manager',
            'components/explore-cohort',
          ], function(ConceptSetStore) {
            sharedState.CohortDefinition.mode('conceptsets')
            sharedState.activeConceptSet(ConceptSetStore.cohortDefinition())
            router.setCurrentView('cohort-definition-manager', {
              cohortDefinitionId,
              mode: 'conceptsets',
              conceptSetId,
            });
          });
        }),

        '/cohortdefinition/:cohortDefinitionId/version/:version': new AuthorizedRoute(
            (cohortDefinitionId, version) => {
              require([
                  'components/cohortbuilder/CohortDefinition',
                  'components/atlas.cohort-editor',
                  './cohort-definitions',
                  './cohort-definition-manager',
                  'components/entityBrowsers/cohort-definition-browser',
                  'conceptset-editor',
                  'components/conceptset/concept-modal',
              ], function() {
                router.setCurrentView('cohort-definition-manager', {
                  cohortDefinitionId,
                  version,
                  mode: 'definition',
                })
                sharedState.CohortDefinition.mode('definition')
              })
            }
        ),

        '/cohortdefinition/:cohortDefinitionId:/?((\w|.)*)': new AuthorizedRoute((cohortDefinitionId, path = 'definition') => {
          require([
           'components/cohortbuilder/CohortDefinition',
            'components/atlas.cohort-editor',
            './cohort-definitions',
            './cohort-definition-manager',
            'components/entityBrowsers/cohort-definition-browser',
            'conceptset-editor',
            './components/reporting/cost-utilization/report-manager',
            'components/explore-cohort',
            'components/conceptset/concept-modal',
          ], function() {
            // Determine the view to show on the cohort manager screen based on the path
            path = path.split("/");
            let view = 'definition';
            if (path.length > 0 && path[0] != "") {
              view = path[0];
            }
            let selectedSourceId = null;
            if (path.length > 1 && path[1] != "") {
              selectedSourceId = parseInt(path[1]);
            }
            // Determine any optional parameters to set based on the query string
            qs = router.qs(); // Get the query string parameters
            var sourceKey = qs.sourceKey || null;
            router.setCurrentView('cohort-definition-manager', {
              cohortDefinitionId,
              selectedSourceId,
              mode: view,
              sourceKey,
            });
          	sharedState.CohortDefinition.mode(view);
          });
        }),

        '/reports': new AuthorizedRoute(() => {
          require([
            './components/reporting/cost-utilization/report-manager',
            './cohort-definition-manager',
            'components/entityBrowsers/cohort-definition-browser',
          ], function () {
            router.setCurrentView('report-manager');
          });
        }),
      };
    }

    return routes;
  }
);