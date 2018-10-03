define(['knockout'], function (ko) {

  function Answer(answer) {
     var self = this;
     self.id = ko.observable(answer.id);
     self.text = ko.observable(answer.text);
     self.value = ko.observable(answer.value);
  }

  Answer.prototype.constructor = Answer;

	return Answer;
});
