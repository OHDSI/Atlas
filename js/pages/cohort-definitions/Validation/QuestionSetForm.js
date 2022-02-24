define(['knockout', 'services/Validation'], function (ko, ValidationService) {
    function QuestionSetForm(id, cohortName) {
        const self = this;
        self.questions = ko.observableArray([]);
        self.questionSetName = ko.observable();
        self.questionTypes = ko.observableArray(['Text', 'Radio Button', 'Checkbox', 'Numeric', 'Date']);
        self.bools = ko.observableArray(['false', 'true']);
        self.caseBools = ko.observableArray(['false', 'true']);
        self.errorMessage = ko.observable();


        function Answer() {
            const self = this;
            self.text = ko.observable();
            self.value = '';
            // self.helpText = ko.observable()
        }

        function Question() {
            const self = this;
            self.text = ko.observable('');
            // self.helpText = ko.observable('');
            self.type = ko.observable('');
            self.caseQuestion = ko.observable('');
            self.required = ko.observable('');
            self.answers = ko.observableArray([]);

            self.addAnswer = function () {
                if ((self.type() !== 'Text' && self.type() !== 'Numeric' && self.type() !== 'Date') && self.type() !== undefined) {
                    self.answers.push(new Answer());
                }
            };
            self.removeAnswer = function (item) {
                self.answers.remove(item);
            };

            self.questionTypeChanged = function (obj, evt) {
                if (obj !== 'Text' && obj !== 'Numeric' && obj !== 'Date') {
                    if (self.answers().length === 0) {
                        self.addAnswer();
                    }
                }
            };
        }

        self.addQuestion = function () {
            self.questions.push(new Question());
        };

        self.initialize = function () {
            self.addQuestion();
        };


        self.removeQuestion = function (item) {
            self.questions.remove(item);
        };

        self.createQuestionSet = function (sampleSourceKey) {
            if (self.errorMessage() != null) {
                self.errorMessage('');
            }

            //check that qset name is not undefined
            if (self.questionSetName() === undefined) {
                self.errorMessage('Please enter question set name.');
                return null;
            }

            if (self.questions().length === 0) {
                self.errorMessage("Please include at least one question");
                return null;
            }

            let numCaseQuestions = 0;
            let currentAnswer = null;
            let i;
            let j = 0;
            for (i = 0; i < self.questions().length; i++) {

                let currentQuestion = self.questions()[i];
                let numAnswers = self.questions()[i].answers().length;
                let currentQuestionType = self.questions()[i].type();


                //check that questions are not null or unselected
                if (currentQuestion.text() == null ||
                    // currentQuestion.helpText() == null ||
                    currentQuestion.type() == null ||
                    currentQuestion.caseQuestion() == null ||
                    currentQuestion.required() == null) {
                    self.errorMessage('Please do not leave any question field blank or unselected.');
                    break;
                }

                const multipleAnswerType = (currentQuestionType !== 'Text' && currentQuestionType !== 'Numeric' && currentQuestionType !== 'Date');
                //enforce that all have answers unless text
                if (numAnswers === 0 && multipleAnswerType) {
                    self.errorMessage('Checkbox and radio button questions must have answers');
                    break;
                }

                //check that answers don't have null values        
                for (j = 0; j < self.questions()[i].answers().length; j++) {
                    currentAnswer = self.questions()[i].answers()[j];
                    if (currentAnswer.text() == null && // || currentAnswer.helpText() == null) && 
                        multipleAnswerType) {
                        self.errorMessage('Please do not leave answers blank.');
                        break;
                    }
                }


                //check that only one question is a case question
                if (currentQuestion.caseQuestion() === 'true') {
                    if (++numCaseQuestions > 1) {
                        self.errorMessage('Only one question can be a case question.');
                        break;
                    }
                }

            }

            if (self.errorMessage()) {
                return null;
            }

            for (i = 0; i < self.questions().length; i++) {
                if (self.questions()[i].type() === 'Text') {
                    self.questions()[i].answers.push(new Answer());
                    self.questions()[i].answers()[0].text = '';
                    self.questions()[i].type = 'TEXTAREA';
                } else if (self.questions()[i].type() === 'Numeric') {
                    self.questions()[i].answers.push(new Answer());
                    self.questions()[i].answers()[0].text = '';
                    self.questions()[i].type = 'NUMERIC';
                } else if (self.questions()[i].type() === 'Date') {
                    self.questions()[i].answers.push(new Answer());
                    self.questions()[i].answers()[0].text = '';
                    self.questions()[i].type = 'DATE';
                } else if (self.questions()[i].type() === "Checkbox") {
                    self.questions()[i].type = 'MULTI_SELECT';
                    for (j = 0; j < self.questions()[i].answers().length; j++) {
                        currentAnswer = self.questions()[i].answers()[j];
                        currentAnswer.value = currentAnswer.text();
                    }
                } else if (self.questions()[i].type() === "Radio Button") {
                    self.questions()[i].type = 'SINGLE_SELECT';
                    for (j = 0; j < self.questions()[i].answers().length; j++) {
                        currentAnswer = self.questions()[i].answers()[j];
                        currentAnswer.value = j;
                    }
                }
            }

            const data = {
                cohortName: cohortName,
                cohortSource: sampleSourceKey,
                cohortId: id,
                name: self.questionSetName(),
                questions: ko.toJS(self.questions())
            };
            return ValidationService.submitQuestionSet(JSON.stringify(data));


        };

        self.initialize();
    }

    QuestionSetForm.prototype.constructor = QuestionSetForm;
    return QuestionSetForm;

});