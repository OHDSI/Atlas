define(function(require, exports) {
  const config = require('appConfig');
  const OHDSIApi = require('ohdsi-api').Api;
  
  class Api extends OHDSIApi {
    handleUnexpectedError() {
      console.error('Oooops!.. Something went wrong :(');
    }

    isSecureUrl(url) {
      var authProviders = config.authProviders.reduce(function(result, current) {
        result[config.api.url + current.url] = current;
        return result;
      }, {});

      return !authProviders[url] && url.startsWith(config.api.url);
    }

    sendRequest(method, path, payload) {
      const params = {
        method,
        headers: this.isSecureUrl(path) ? this.getHeaders() : {},
      };

      if (payload && payload instanceof FormData) {
        params.body = payload;
      } else if (payload) {
        params.body = JSON.stringify(payload);
        params.headers['Content-Type'] = 'application/json';
      }

      return fetch(path, params)
        .then(res => {
          const headers = res.headers;
          return res.text()
            // Protection from empty response
            .then(text => text ? JSON.parse(text) : {})
            .then(data => ({ ok: res.ok, status: res.status, data, headers }))
        })
        .then((res) => {
          if (!this.checkStatusError(res)) {
            throw res;
          }
          return res;
        });
    }
  }

  const singletonApi = new Api();
  // singletonApi.setApiHost(config.api.url);
  singletonApi.setAuthTokenHeader('Authorization');

  return singletonApi;
});
