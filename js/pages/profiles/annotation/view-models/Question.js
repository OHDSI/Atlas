define(['knockout', './Answer'], function (ko, Answer) {

    function Question(question) {

        const self = this;
        self.id = ko.observable(question.id);
        self.text = ko.observable(question.text);
        self.type = ko.observable(question.type);
        self.required = ko.observable(question.required);
        self.answers = ko.observableArray();

        for (let i = 0; i < question.answers.length; i++) {
            let answer = new Answer(question.answers[i]);
            self.answers.push(answer);
        }
    }

    Question.prototype.constructor = Question;

    return Question;
});