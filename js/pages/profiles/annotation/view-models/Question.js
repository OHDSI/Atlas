define(['knockout', './Answer'], function (ko, Answer) {

  function Question(question) {

    var self = this;
    self.id = ko.observable(question.id);
    self.text = ko.observable(question.text);
    self.type = ko.observable(question.type);
    self.answers = ko.observableArray();

    for (var i = 0; i < question.answers.length; i ++) {
      var answer = new Answer(question.answers[i]);
      self.answers.push(answer);
    }
  }

  Question.prototype.constructor = Question;

	return Question;
});
