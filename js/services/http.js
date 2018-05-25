define(function(require, exports) {
  const config = require('appConfig');
  
  const STATUS = {
    OK: 200,
    UNAUTHORIZED: 401,
  };
  const METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
  };
  const AUTH_TOKEN_HEADER = 'Authorization';
  const JSON_RESPONSE_TYPE = 'application/json';

  const HEADERS = {
    Accept: JSON_RESPONSE_TYPE,
  };

  class Api {

    constructor() {
      this.apiHost = '';
    }

    setApiHost(url) {
      this.apiHost = url;
    }

    // eslint-disable-next-line class-methods-use-this
    getUserToken() {
      throw 'Replace this interface with implementation';
    }

    setUserTokenGetter(getUserToken) {
      this.getUserToken = getUserToken;
      return this;
    }

    // eslint-disable-next-line class-methods-use-this
    handleUnauthorized() {
      throw 'Replace this interface with implementation';
    }

    setUnauthorizedHandler(handler) {
      this.handleUnauthorized = handler;
      return this;
    }

    // eslint-disable-next-line class-methods-use-this
    handleUnexpectedError() {
      alert('Oooops!.. Something went wrong :(');
    }

    getHeaders() {
      const headers = { ...HEADERS };
      const token = this.getUserToken();

      if (token) {
        headers[AUTH_TOKEN_HEADER] = token;
      }

      return headers;
    }

    isSecureUrl(url) {
      var authProviders = config.authProviders.reduce(function(result, current) {
        result[config.api.url + current.url] = current;
        return result;
      }, {});

      return !authProviders[url] && url.startsWith(config.api.url);
    }

    /**
     * Checks HTTP status for errors.
     * @param  { {[x: string]: any} } response
     * @return {boolean}
     */
    checkStatusError(response) {
      const status = response.status;

      switch (status) {
        case STATUS.OK:
          return true;
        case STATUS.UNAUTHORIZED:
          this.handleUnauthorized(response.json);
          break;
        default:
          this.handleUnexpectedError();
          break;
      }

      return false;
    }

    sendRequest(method, path, payload) {
      const params = {
        method,
        headers: this.isSecureUrl(path) ? this.getHeaders() : {},
      };

      if (payload && payload instanceof FormData) {
        params.body = payload;
        // NOTE:
        // Do not set 'Content-Type' - browser will automatically do this.
        // Problem is in a 'boundary'.
        // http://stackoverflow.com/questions/39280438/fetch-missing-boundary-in-multipart-form-data-post
      } else if (payload) {
        params.body = JSON.stringify(payload);
        params.headers['Content-Type'] = JSON_RESPONSE_TYPE;
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

    doGet(path, payload) {
      return this.sendRequest(METHODS.GET, path);
    }

    doPost(path, payload) {
      return this.sendRequest(METHODS.POST, path, payload);
    }

    doPut(path, payload) {
      return this.sendRequest(METHODS.PUT, path, payload);
    }

    doDelete(path, payload) {
      return this.sendRequest(METHODS.DELETE, path, payload);
    }
  }

  const singletonApi = new Api();
  singletonApi.setApiHost(config.api.url);

  return singletonApi;
});
