define(
	(require, factory) => {
    const { AuthorizedRoute } = require('pages/Route');
    const globalConstants = require('const');
    function routes(router) {
      const detailsRoute = new AuthorizedRoute((conceptSetId, mode = 'conceptset-expression') => {
        require(['./conceptset-manager', 'components/cohort-definition-browser', 'conceptset-list-modal'], function () {
          sharedState.activeConceptSetSource(globalConstants.conceptSetSources.repository);
          router.setCurrentView('conceptset-manager', {
            conceptSetId: conceptSetId && parseInt(conceptSetId),
            mode,
          })
        });
      });

      return {
        '/conceptset/:conceptSetId': detailsRoute,
        '/conceptset/:conceptSetId/:mode': detailsRoute,
        '/conceptsets': new AuthorizedRoute(() => {
          require(['./conceptset-browser'], function () {
            router.setCurrentView('conceptset-browser');
          });
        }),
        '/concept/:conceptId:': new AuthorizedRoute((conceptId) => {
          require(['./concept-manager'], function () {
            router.setCurrentView('concept-manager', { conceptId });
          });
        }),
      };
    }

    return routes;
  }
);