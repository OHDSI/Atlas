define(
  (require, factory) => {
    const { AuthorizedRoute } = require('providers/Route');
    function routes(appModel) {
      return {        
        '/conceptset/:conceptSetId/:mode': new AuthorizedRoute((conceptSetId, mode) => {
          appModel.activePage(this.title);
          require(['conceptset-manager', 'components/cohort-definition-browser', 'conceptset-list-modal'], function () {            
            appModel.loadConceptSet(conceptSetId, 'conceptset-manager', 'repository', mode);
            appModel.resolveConceptSetExpression();
          });
        }),
        '/conceptsets': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['conceptset-browser'], function () {
            appModel.currentView('conceptset-browser');
          });
        }),
        '/concept/:conceptId:': new AuthorizedRoute((conceptId) => {
          appModel.activePage(this.title);
          require(['concept-manager'], function () {
            appModel.currentConceptId(conceptId);
            appModel.currentView('concept-manager');
          });
        }),
      };
    }

    return routes;
  }
);