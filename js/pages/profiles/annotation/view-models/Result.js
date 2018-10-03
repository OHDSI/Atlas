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
  }

  Result.prototype.constructor = Result;

	return Result;
});
