define(['knockout', './Question'], function (ko, Question) {

    function Set(set) {

        const self = this;
        self.id = ko.observable();
        self.questions = ko.observableArray();

        self.id(set.id);

        set.questions.sort((a, b) => a.id - b.id);

        for (let i = 0; i < set.questions.length; i++) {
            let question = new Question(set.questions[i]);
            self.questions.push(question);
        }
    }

    Set.prototype.constructor = Set;

    return Set;
});