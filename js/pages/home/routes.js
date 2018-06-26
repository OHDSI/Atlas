define(
  (require, factory) => {
    function routes(appModel) {
      return {
        '/': () => {
          appModel.activePage(this.title);
          document.location = "#/home";
        },
        '/home': () => {
          appModel.activePage(this.title);
          require(['home'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('home');
          });
        },
        '/welcome/:token': (token) => {
          appModel.activePage(this.title);
          require(['welcome'], function () {
            authApi.token(token);
            document.location = "#/welcome";
          });
        },
      };
    }

    return routes;
  }
);