define(
	(require, factory) => {
    const { AuthorizedRoute } = require('pages/Route');
    const globalConstants = require('const');
    const sharedState = require('atlas-state');
		const ConceptSetStore = require('components/conceptset/ConceptSetStore');
		
    function routes(router) {
      const detailsRoute = new AuthorizedRoute((conceptSetId, mode = 'conceptset-expression') => {
        require(['./conceptset-manager', 'components/entityBrowsers/cohort-definition-browser', 'components/conceptset/concept-modal'], function () {
					//sharedState.activeConceptSet(ConceptSetStore.getStore(ConceptSetStore.sourceKeys().repository));					
          router.setCurrentView('conceptset-manager', {
            conceptSetId: conceptSetId && parseInt(conceptSetId),
            mode,
          })
        });
      });

      return {
        '/conceptset/:conceptSetId': detailsRoute,
        '/conceptset/:conceptSetId/:mode': detailsRoute,
        '/conceptset/:conceptSetId/version/:version': new AuthorizedRoute((conceptSetId, version) => {
          require(['./conceptset-manager'], function () {
            router.setCurrentView('conceptset-manager', {
                conceptSetId: conceptSetId && parseInt(conceptSetId),
                version: version,
                mode: 'conceptset-expression'
            });
          });
        }),
        '/conceptsets': new AuthorizedRoute(() => {
          require(['./conceptset-browser'], function () {
            router.setCurrentView('conceptset-browser');
          });
        }),
        '/concept/:conceptId:': new AuthorizedRoute((conceptId) => {
          require(['./components/concept/concept-manager'], function () {
            router.setCurrentView('concept-manager', { conceptId });
          });
        }),
      };
    }

    return routes;
  }
);