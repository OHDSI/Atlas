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
        '/welcome/:authClient/:token': new Route((authClient, token) => {
          require(['welcome'], function () {
            setAuth(token, authClient, "/welcome");
          });
        }),
        '/welcome/:authClient/:token/:url': new Route((authClient, token, url) => {
          require([], function () {
            setAuth(token, authClient, decodeURIComponent(url));
          });
        }),
      };
    }

    function setAuth(token, authClient, url) {
      authApi.token(token);
      authApi.authClient(authClient);
      authApi.loadUserInfo().then(() => {
        document.location = '#' + url;
      });
    }

    return routes;
  }
);