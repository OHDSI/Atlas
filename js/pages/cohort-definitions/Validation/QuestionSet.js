define(['knockout', 'services/Validation', './QuestionSetForm'], function (ko, ValidationService, QuestionSetForm) {
    function QuestionSet(id, cohortName) {
        var self = this;
        self.qset = ko.observableArray([]);
        self.qsetName = ko.observable();

        self.questionSetForm = new QuestionSetForm(id, cohortName)

        self.submitQsetForm = function (sn) {
            self.questionSetForm.createQuestionSet(sn)
        };

        self.getQsets = function() {
            ValidationService.getQsets(id).then((data) => {
                if (data.length > 0) {
					var set = [];
					this.qsetName = ko.observable(data[0]['name']);
					for (var i = 0; i<data[data.length-1].questions.length; i++) {
						var qs = {};
						var qsAnswers = [];
						var cq = data[0].questions[i];
						var qnum = "Question " + (i+1) + ': ';

						if (cq !== undefined) {
							qs['text'] = qnum + cq.text;
							qs['type'] = 'Question Type: ' +  cq.text;
							qs['caseQ'] = 'Case Question: ' + cq.caseQuestion;
							qs['req'] = 'Required: '  + cq.required;
							for (let j = 0; j < cq.answers.length; j++) {
								if (cq.type !== 'TEXTAREA') {
									qsAnswers.push(cq.answers[j].text);
								} else {
									qsAnswers.push("None");
								}
							}
							qs['answers'] = qsAnswers;
						} else {
							qs['text'] = qnum + '';
							qs['type'] = 'Question Type: ' + '';
							qs['caseQ'] = 'Case Question: ' + '';
							qs['req'] = 'Required: '  + '';
						}
						set.push(qs);
					}
					this.qset(set);
				} else {
					this.qset([]);
				}
            });
        };
        self.getQsets();

        
        // self.createQsetRedirect = function() {
		// 		if (this.qset().length != 0) {
		// 			var cont = confirm("Creating a new set will make this one unavliable")
		// 			if (cont != true) {
		// 				return -1
		// 			}
		// 			this.qset([])

		// 		}
		// 	}

    }
    QuestionSet.prototype.constructor = QuestionSet;
    return QuestionSet;
    
});