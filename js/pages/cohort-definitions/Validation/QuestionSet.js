define(['knockout', 'services/Validation', './QuestionSetForm'], function (ko, ValidationService, QuestionSetForm) {
    function QuestionSet(id, cohortName, qSetId, qSetName, qSetQuestions, mode) {
        var self = this;
        self.qsetName = ko.observable(qSetName);
        self.setId = ko.observable(qSetId);
        self.setQuestions = ko.observableArray(qSetQuestions);
        self.mode = ko.observable(mode);
        self.questionItems = ko.observableArray([]);

        self.questionSetForm = new QuestionSetForm(id, cohortName);

        self.goBack = function(parent) {
            setTimeout(() => {
                parent.valTabMode(parent.default_view);
                // if you don't do this, ko complains.
            }, 1000);


        };

        self.resetValues = function(id, cohortName, qSetId, qSetName, qSetQuestions, mode) {
            self.qsetName(qSetName);
            self.setId(qSetId);
            self.setQuestions(qSetQuestions);
            self.mode(mode);
            self.showSelectedQset();
        };

        self.submitQsetForm = function (sn) {
            return self.questionSetForm.createQuestionSet(sn);
        };

        self.initialize = function() {
            self.questionSetForm.initialize();
        };


        self.showSelectedQset = function() {
            self.questionItems([]);
            for (var i = 0; i < self.setQuestions().length; i++) {
                var qs = {};
                var qsAnswers = [];
                var cq = self.setQuestions()[i];
                var qnum = "Question " + (i + 1) + ': ';

                if (cq !== undefined) {
                    qs['text'] = qnum + cq.text;
                    qs['type'] = 'Question Type: ' + cq.type;
                    qs['caseQ'] = 'Case Question: ' + cq.caseQuestion;
                    qs['req'] = 'Required: ' + cq.required;
                    for (var j = 0; j < cq.answers.length; j++) {
                        if (cq.type !== 'TEXTAREA') {
                            qsAnswers.push(cq.answers[j].text);
                        } else {
                            qsAnswers.push("None");
                        }
                    }
                } else {
                    qs['text'] = qnum + '';
                    qs['type'] = 'Question Type: ' + '';
                    qs['caseQ'] = 'Case Question: ' + '';
                    qs['req'] = 'Required: ' + '';
                }
                qs['answers'] = qsAnswers;
                self.questionItems.push(qs);
            }
        };


    }
    QuestionSet.prototype.constructor = QuestionSet;
    return QuestionSet;
    
});