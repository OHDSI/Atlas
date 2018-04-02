define(function (require, exports) {

  var jsCookie = require('js-cookie');

  function setField(field, value) {
    jsCookie.set(field, value, { expires: 365, path: '/' });
  }

  function clearField(field) {
    jsCookie.remove(field, { path: '/' });
  }

  var api = {
    setField: setField,
    clearField: clearField,
  };

  return api;
});