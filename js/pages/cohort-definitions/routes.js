define((require, factory) => {
  const { AuthorizedRoute } = require('pages/Route')
  const sharedState = require('atlas-state')
  function routes(router) {
    return {
      '/cohortdefinitions': new AuthorizedRoute(() => {
        require([
          './cohort-definitions',
          './cohort-definition-manager',
          'components/cohort-definition-browser',
        ], function() {
          router.setCurrentView('cohort-definitions')
        })
      }),

      '/cohortdefinition/:cohortDefinitionId/samples': new AuthorizedRoute(
        cohortDefinitionId => {
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
          ], function() {
            // not re-render component if it was rendered already
            router.setCurrentView('cohort-definition-manager', {
              cohortDefinitionId,
              mode: 'samples',
            })
            sharedState.ConceptSet.source('cohort')
            sharedState.CohortDefinition.mode('samples')
          })
        }
      ),

      '/cohortdefinition/:cohortDefinitionId/samples/:sampleId/:sourceKey': new AuthorizedRoute(
        (cohortDefinitionId, sampleId, sourceKey) => {
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
          ], function() {
            router.setCurrentView('cohort-definition-manager', {
              cohortDefinitionId,
              sampleId,
              sourceKey,
              mode: 'samples',
            })
            sharedState.ConceptSet.source('cohort')
            sharedState.CohortDefinition.mode('samples')
          })
        }
      ),

      '/cohortdefinition/:cohortDefinitionId/conceptsets/:conceptSetId/:mode': new AuthorizedRoute(
        (cohortDefinitionId, conceptSetId, mode) => {
          require([
            'components/cohortbuilder/CohortDefinition',
            'components/atlas.cohort-editor',
            './cohort-definitions',
            './cohort-definition-manager',
            'components/cohort-definition-browser',
            'conceptset-editor',
            './components/reporting/cost-utilization/report-manager',
            'explore-cohort',
          ], function() {
            sharedState.CohortDefinition.mode('conceptsets')
            sharedState.ConceptSet.source('cohort')
            router.setCurrentView('cohort-definition-manager', {
              cohortDefinitionId,
              mode: 'conceptsets',
              conceptSetId,
            })
          })
        }
      ),
      '/cohortdefinition/:cohortDefinitionId:/?((w|.)*)': new AuthorizedRoute(
        (cohortDefinitionId, path = 'definition') => {
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
          ], function() {
            // Determine the view to show on the cohort manager screen based on the path
            path = path.split('/')
            let view = 'definition'
            if (path.length > 0 && path[0] != '') {
              view = path[0]
            }
            // Determine any optional parameters to set based on the query string
            qs = router.qs() // Get the query string parameters
            var sourceKey = qs.sourceKey || null
            router.setCurrentView('cohort-definition-manager', {
              cohortDefinitionId,
              mode: 'definition',
              sourceKey,
            })
            sharedState.ConceptSet.source('cohort')
            sharedState.CohortDefinition.mode(view)
          })
        }
      ),

      '/reports': new AuthorizedRoute(() => {
        require([
          './components/reporting/cost-utilization/report-manager',
          './cohort-definition-manager',
          'components/cohort-definition-browser',
        ], function() {
          router.setCurrentView('report-manager')
        })
      }),
    }
  }

  return routes
})
