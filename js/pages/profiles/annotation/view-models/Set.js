define(['knockout', './Question'], function (ko, Question) {

  function Set(set) {

    var self = this;
    self.id = ko.observable();
    self.questions = ko.observableArray();

    self.id(set.id);

    for (var i = 0; i < set.questions.length; i ++) {
      var question = new Question(set.questions[i]);
      self.questions.push(question);
    }
  }

  Set.prototype.constructor = Set;

	return Set;
});
