define(function (require, exports) {

  var moment = require('moment');
  const PARSE_FORMAT = 'YYYY-MM-DD, H:mm';
  const DATE_TIME_FORMAT = 'MM/DD/YYYY h:mm:ss A';
  const DATE_FORMAT = 'MM/DD/YYYY';
  const DURATION_FORMAT = 'HH:mm:ss';
  const EMPTY_DATE = '';

  function formatDateTime(date) {
    var m = moment(date, PARSE_FORMAT);
    return m.isValid() ? m.format(DATE_TIME_FORMAT) : EMPTY_DATE;
  }

  function formatDate(date) {
    var m = moment(date, PARSE_FORMAT);
    return m.isValid() ? m.format(DATE_FORMAT) : EMPTY_DATE;
  }

  function formatDuration(ms) {
    var m = moment("1900-01-01 00:00:00").add(ms);
    return m.isValid() ? m.format(DURATION_FORMAT) : EMPTY_DATE;
  }

  function formatDateTimeUTC(timestamp) {
    var m = moment(timestamp);
    return m.isValid() ? m.format(DATE_TIME_FORMAT) : EMPTY_DATE;
  }

  var api = {
    formatDateTime: formatDateTime,
    formatDate: formatDate,
    formatDuration: formatDuration,
    formatDateTimeUTC: formatDateTimeUTC,
  };

  return api;
});