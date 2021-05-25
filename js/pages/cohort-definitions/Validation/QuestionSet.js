define(['knockout', 'services/Validation', './QuestionSetForm'], function (ko, ValidationService, QuestionSetForm) {
    function QuestionSet(id, cohortName, qSetId, qSetName, qSetQuestions, mode) {
        var self = this;
        self.qset = ko.observable();
        self.qsetName = ko.observable(qSetName);
        self.setId = ko.observable(qSetId);
        self.setQuestions = ko.observableArray(qSetQuestions);
        self.mode = ko.observable(mode);

        self.questionSetForm = new QuestionSetForm(id, cohortName);

        self.goBack = function(parent) {
            setTimeout(() => {
                parent.valTabMode(parent.default_view);
                // if you don't do this, ko complains.
            }, 1000);


        };

        self.submitQsetForm = function (sn) {
            return self.questionSetForm.createQuestionSet(sn);
        };


        self.showSelectedQset = function() {
            for (var i = 0; i < self.setQuestions.length; i++) {
                var qs = {};
                var qsAnswers = [];
                var cq = self.setQuestions.questions[i];
                var qnum = "Question " + (i + 1) + ': ';

                if (cq !== undefined) {
                    qs['text'] = qnum + cq.text;
                    qs['type'] = 'Question Type: ' + cq.text;
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
                self.qset(qs);
            }
        };


    }
    QuestionSet.prototype.constructor = QuestionSet;
    return QuestionSet;
    
});