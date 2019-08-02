define(
	(require, factory) => {
    const { AuthorizedRoute } = require('pages/Route');
    function routes(appModel, router) {
      const detailsRoute = new AuthorizedRoute((conceptSetId, mode = 'conceptset-expression') => {
        require(['./conceptset-manager', 'components/cohort-definition-browser', 'conceptset-list-modal'], function () {
          appModel.loadConceptSet(conceptSetId, 'conceptset-manager', 'repository', mode);
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
            appModel.currentConceptId(conceptId);
            router.setCurrentView('concept-manager', { conceptId });
          });
        }),
      };
    }

    return routes;
  }
);