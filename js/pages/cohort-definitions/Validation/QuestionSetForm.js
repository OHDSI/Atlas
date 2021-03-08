define(['knockout', 'services/Validation'], function (ko, ValidationService) {
    function QuestionSetForm(id, cohortName) {
        var self = this;
        self.questions = ko.observableArray([])
        self.questionSetName = ko.observable()
        self.questionTypes = ko.observableArray(['Checkbox', 'Radio Button', 'Text']);
        self.bools = ko.observableArray(['true', 'false'])
        self.errorMessage = ko.observable()

        function Question() {
            var self = this;
            self.text = ko.observable('');
            // self.helpText = ko.observable('');
            self.type =ko.observable('');
            self.caseQuestion = ko.observable('');
            self.required = ko.observable('');
            self.answers = ko.observableArray([])

            self.addAnswer = function() {
                if (self.type() != 'Text' && self.type() != undefined) {
                    self.answers.push(new Answer())
                }
            }
            self.removeAnswer = function(item) {
                self.answers.remove(item)
            }
        }

        function Answer() {
            var self = this;
            self.text = ko.observable()
            self.value = '';
            // self.helpText = ko.observable()
        }

        self.addQuestion = function() {
            self.questions.push(new Question());
        }
        self.removeQuestion = function(item) {
            self.questions.remove(item)
        }

        self.createQuestionSet = function (sampleSourceKey) {
            if (self.errorMessage() != null) {
                self.errorMessage('');
            }

            //check that qset name is not undfined
            if (self.questionSetName() == undefined) {
                self.errorMessage('Please enter question set name.');
                return null;
            }
            
            if (self.questions().length == 0) {
                self.errorMessage("Please include at least one question");
                return null;
            }

            var numCaseQuestions = 0;
            for (var i =0; i < self.questions().length; i++) {
                
                currentQuestion = self.questions()[i]
                numAnswers = self.questions()[i].answers().length;
                currentQuestionType = self.questions()[i].type()
                
                //check that questions are not null or unselected
                if (currentQuestion.text() == null ||
                    // currentQuestion.helpText() == null ||
                    currentQuestion.type() == null ||
                    currentQuestion.caseQuestion() == null ||
                    currentQuestion.required() == null) {
                        self.errorMessage('Please do not leave any question field blank or unselected.');
                        break;
                    }
                
                //enforce that all have answers unless text
                if (numAnswers == 0 && currentQuestionType != 'Text') {
                    self.errorMessage('Checkbox and radio button questions must have answers');
                    break;
                }

                //check that answers don't have null values        
                for (var j=0; j< self.questions()[i].answers().length; j++) {
                    currentAnswer = self.questions()[i].answers()[j]
                    if (currentAnswer.text() == null && // || currentAnswer.helpText() == null) && 
                        currentQuestionType != 'Text') {
                        self.errorMessage('Please do not leave answers blank.')
                        break;
                    }
                }

                
                //check that only one question is a case question
                if (currentQuestion.caseQuestion() == 'true') {
                    if (++numCaseQuestions > 1) {
                        self.errorMessage('Only one question can be a case question.')
                        break;
                    }
                }
                
            }

            if (self.errorMessage()) {
                return null;
            }

            for (var i =0; i < self.questions().length; i++) {
                if (self.questions()[i].type() == 'Text') {
                    self.questions()[i].answers.push(new Answer());
                    self.questions()[i].answers()[0].text = '';
                    self.questions()[i].type = 'TEXTAREA'
                } else if (self.questions()[i].type() == "Checkbox") {
                    self.questions()[i].type = 'MULTI_SELECT'
                    for (var j=0; j< self.questions()[i].answers().length; j++) {
                        currentAnswer = self.questions()[i].answers()[j]
                        currentAnswer.value = currentAnswer.text()
                    }
                } else if (self.questions()[i].type() == "Radio Button") {
                    self.questions()[i].type = 'SINGLE_SELECT'
                    for (var j=0; j< self.questions()[i].answers().length; j++) {
                        currentAnswer = self.questions()[i].answers()[j]
                        currentAnswer.value = j;
                    }
                }
            }

            var data = {cohortName: cohortName, 
                        cohortSource: sampleSourceKey, 
                        cohortId: id, 
                        name: self.questionSetName(),
                        questions: ko.toJS(self.questions())}
            ValidationService.submitQuestionSet(JSON.stringify(data));
            location.reload()
        }
    }
    QuestionSetForm.prototype.constructor = QuestionSetForm;
    return QuestionSetForm;
    
});