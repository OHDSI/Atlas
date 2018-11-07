define(['knockout'], function (ko) {

  function Result(result, set) {
    var self = this;
    self.questionId = ko.observable();

    if (result.type == 'MULTI_SELECT') {
      self.value = ko.observableArray();
      self.value(result.value ? result.value : []);
    } else {
      self.value = ko.observable();
      self.value(result.value ? result.value : '');
    }

    self.questionId(result.questionId);
    self.answerId = result.answerId;
    self.type = result.type;
    self.setId = result.setId;

    self.validate = function(value) {
      return ((value && !Array.isArray(value)) || (Array.isArray(value) && value.length > 0)) ? true : false;
    }

    self.required = ko.observable(result.required);
    self.valid = ko.observable(true);

    self.value.subscribe(function(newValue) {
      self.valid(self.validate(newValue));
    });
  }

  Result.prototype.constructor = Result;

	return Result;
});
