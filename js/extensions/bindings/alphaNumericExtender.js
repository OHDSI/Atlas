define(['knockout', './regexpExtender'], function (ko) {
    ko.extenders.alphaNumeric = (target) => ko.extenders.regexp(target, { pattern: '^[a-zA-Z0-9.]+$', allowEmpty: true });
});