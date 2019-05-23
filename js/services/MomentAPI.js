define(function (require, exports) {

  const moment = require('moment');
  const PARSE_FORMAT = 'YYYY-MM-DD, H:mm';
  const DATE_TIME_FORMAT = 'MM/DD/YYYY h:mm A';
  const DATE_FORMAT = 'MM/DD/YYYY';
  const DURATION_FORMAT = 'HH:mm:ss';
  const EMPTY_DATE = '';

  function formatDateTime(date) {
    var m = moment(date, PARSE_FORMAT);
    return m.isValid() ? m.format(DATE_TIME_FORMAT) : EMPTY_DATE;
  }

  function formatDate(date, outFormat) {
    var m = moment(date, PARSE_FORMAT);
    return m.isValid() ? m.format(outFormat || DATE_FORMAT) : EMPTY_DATE;
  }

  function formatDuration(ms) {
    var m = moment("1900-01-01 00:00:00").add(ms);
    return m.isValid() ? m.format(DURATION_FORMAT) : EMPTY_DATE;
  }

  function formatDateTimeWithFormat(timestamp, outFormat) {
    var m = moment(timestamp);
    return m.isValid() ? m.format(outFormat) : EMPTY_DATE;
  }

  function formatDateTimeUTC(timestamp) {
    const m = moment(typeof timestamp === 'string' ? moment.utc(timestamp).valueOf() : timestamp);
    return m.isValid() ? m.format(DATE_TIME_FORMAT) : EMPTY_DATE;
  }

  function diffInDays(fromDate, toDate) {
    const fd = moment(fromDate);
    const td = moment(toDate);

    return td.diff(fd, 'days');
  }

  var api = {
    formatDateTime: formatDateTime,
    formatDate: formatDate,
    formatDuration: formatDuration,
    formatDateTimeUTC: formatDateTimeUTC,
    formatDateTimeWithFormat: formatDateTimeWithFormat,
    diffInDays,
    PARSE_FORMAT,
    DATE_TIME_FORMAT,
    DATE_FORMAT,
    DURATION_FORMAT,
  };

  return api;
});