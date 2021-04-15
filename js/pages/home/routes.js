define(
	(require, factory) => {
    const { Route } = require('pages/Route');
    const authApi = require('services/AuthAPI');

    function routes(router) {
      return {
        '/': new Route(() => {
          document.location = "#/home";
        }),
        '/home': new Route(() => {
          require(['./home'], function () {
            router.setCurrentView('home');
          });
        }),
        '/welcome/:authClient/reloginRequired': new Route((authClient) => {
          require(['welcome'], function () {
            setAuth(null, authClient, true, "/welcome");
          });
        }),
        '/welcome/:authClient/:token': new Route((authClient, token) => {
          require(['welcome'], function () {
            setAuth(token, authClient, false, "/welcome");
          });
        }),
        '/welcome/:authClient/:token/:url': new Route((authClient, token, url) => {
          require([], function () {
            setAuth(token, authClient, false, decodeURIComponent(url));
          });
        }),
      };
    }

    function setAuth(token, authClient, reloginRequired, url) {
      authApi.token(token);
      authApi.reloginRequired(reloginRequired);
      authApi.authClient(authClient);
      if (!reloginRequired) {
        authApi.loadUserInfo().then(() => {
          document.location = '#' + url;
        });
      } else {
        authApi.signInOpened(true);
        document.location = '#' + url;
      }
    }    

    return routes;
  }
);