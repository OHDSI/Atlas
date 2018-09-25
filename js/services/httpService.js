define(function(require, exports) {
  const ko = require('knockout');
  const config = require('appConfig');
  const OHDSIApi = require('ohdsi-api').Api;
  const JSON_RESPONSE_TYPE = 'application/json';
  const TEXT_RESPONSE_TYPE = 'text/plain';

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

    getHeaders(requestUrl) {
      return this.isSecureUrl(requestUrl) ? super.getHeaders() : {};
    }

    sendRequest(method, path, payload) {
      const data = payload instanceof FormData
        ? payload
        : ko.toJS(payload);
      return super.sendRequest(method, path, data);
    }

    sendResult(res, parsedResponse) {
      return {
        ...super.sendResult(res, parsedResponse),
        data: parsedResponse,
        headers: res.headers,
      };
    }

    afterRequestHook(res) {
      if (!this.checkStatusError(res)) {
        throw res;
      }
      return res;
    }
  }

  class PlainTextApi extends Api {
    get headers() {
      return {
        'Accept': TEXT_RESPONSE_TYPE,
      };
    }

    parseResponse(text) {
      return text;
    }
  }

  const singletonApi = new Api();
  singletonApi.setAuthTokenHeader('Authorization');
  
  const plainTextService = new PlainTextApi();
  plainTextService.setAuthTokenHeader(singletonApi.AUTH_TOKEN_HEADER);  
  plainTextService.setUnauthorizedHandler(() => singletonApi.handleUnauthorized());
  plainTextService.setUserTokenGetter(() => singletonApi.getUserToken());

  singletonApi.plainTextService = plainTextService;

  return singletonApi;
});
