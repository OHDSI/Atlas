define(function (require, exports) {

  const moment = require('moment');
  const ko = require('knockout');
  const sharedState = require('atlas-state');
  const {get} = require("lodash");
  const PARSE_FORMAT = 'YYYY-MM-DD, H:mm';
  const DATE_TIME_FORMAT = 'MM/DD/YYYY h:mm A';
  const DATE_TIME_FORMAT_WITH_SECONDS = 'MM/DD/YYYY h:mm:ss A';
  const DATE_FORMAT = 'MM/DD/YYYY';
  const ISO_DATE_FORMAT = 'YYYY-MM-DD';
  const DURATION_FORMAT = 'HH:mm:ss';
  const DESIGN_DATE_TIME_FORMAT = 'YYYY-MM-DD H:mm';
  const EMPTY_DATE = '';

  const dateTimeFormat = ko.computed(() => get(ko.unwrap(sharedState.localeSettings), "format.date.datetime", DATE_TIME_FORMAT));
  const dateTimeFormatWithSeconds = ko.computed(() => get(ko.unwrap(sharedState.localeSettings), "format.date.datetimeWithSeconds", DATE_TIME_FORMAT_WITH_SECONDS));
  const seconds = ko.computed(() => get(ko.unwrap(sharedState.localeSettings), "format.date.seconds", "sec"));
  const minutes = ko.computed(() => get(ko.unwrap(sharedState.localeSettings), "format.date.minutes", "min"));

  function formatDateTime(date) {
    var m = moment(date, PARSE_FORMAT);
    return m.isValid() ? m.format(dateTimeFormat()) : EMPTY_DATE;
  }

  function formatDate(date, outFormat) {
    var m = moment(date, PARSE_FORMAT);
    return m.isValid() ? m.format(outFormat || DATE_FORMAT) : EMPTY_DATE;
  }

  function formatDuration(ms) {
    var m = moment("1900-01-01 00:00:00").add(ms);
    return m.isValid() ? m.format(DURATION_FORMAT) : EMPTY_DATE;
  }

  function formatInterval(ms) {
    const durationSec = ms / 1000;
    return `${Math.floor(durationSec / 60)} ${minutes()} ${Math.round(durationSec % 60)} ${seconds()}`;
  }

  function formatDateTimeWithFormat(timestamp, outFormat) {
    if (timestamp === undefined || timestamp === null) {
      return EMPTY_DATE;
    }
    var m = moment(timestamp);
    return m.isValid() ? m.format(outFormat) : EMPTY_DATE;
  }

  function formatDateTimeUTC(timestamp, withSeconds) {
    const m = moment(typeof timestamp === 'string' ? moment.utc(timestamp).valueOf() : timestamp);
    let format = withSeconds ? dateTimeFormatWithSeconds() : dateTimeFormat();
    return m.isValid() ? m.format(format) : EMPTY_DATE;
  }

  function diffInDays(fromDate, toDate) {
    const fd = moment(fromDate);
    const td = moment(toDate);

    return td.diff(fd, 'days');
  }

  function formatDateToString(value, format = ISO_DATE_FORMAT) {
    return value instanceof Date ? moment(value).format(format) : value;
  }

  var api = {
    formatDateTime: formatDateTime,
    formatDate: formatDate,
    formatDuration: formatDuration,
    formatDateTimeUTC: formatDateTimeUTC,
    formatDateTimeWithFormat: formatDateTimeWithFormat,
    formatInterval,
    formatDateToString,
    diffInDays,
    PARSE_FORMAT,
    DATE_TIME_FORMAT,
    DATE_FORMAT,
    DURATION_FORMAT,
    DESIGN_DATE_TIME_FORMAT,
    ISO_DATE_FORMAT
  };

  return api;
});