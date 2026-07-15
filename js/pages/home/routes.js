define(
	(require, factory) => {
    const { Route } = require('pages/Route');
    const authApi = require('services/AuthAPI');
    const appConfig = require('appConfig');

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
        '/otc': new Route(() => {
          const params = router.qs();
          const otcCode = params.code;

          if (otcCode) {
            $.ajax({
              method: 'GET',
              url: appConfig.webAPIRoot + 'user/login/otc?code=' + encodeURIComponent(otcCode),
              success: function(data, textStatus, jqXHR) {
                if (data.jwt) {
                  authApi.setAuthParams(data.jwt);
                  authApi.loadUserInfo().then(() => {
                    document.location = '#/home';
                  }).catch(err => {
                    console.error('Failed to load user info:', err);
                    document.location = '#/home';
                  });
                }
              },
              error: function(jqXHR, textStatus, errorThrown) {
                console.error('OAuth token exchange failed:', errorThrown);
                authApi.signInOpened(true);
                document.location = '#/home';
              }
            });
          } else {
            document.location = '#/home';
          }
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