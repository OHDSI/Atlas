define(['knockout', 'services/Validation', './QuestionSet', 'utils/CsvUtils'], function (ko, ValidationService, QuestionSet, CsvUtils) {
    function ValidationTool(id, cohortName) {
        var self = this;
        self.valTabMode = ko.observable('qset');
        self.showCreateValidationSet = ko.observable(false);
        self.errorMessage = ko.observable('');
        
        self.sampleSourceKey = ko.observable();
        self.sampleSize = ko.observable();
        self.sampleName = ko.observable();
        self.samples = ko.observableArray([]);
        self.display_sample = ko.observableArray([]);

        self.questionSet = new QuestionSet(id, cohortName);

        self.submitQsetForm = function () {
            self.questionSet.submitQsetForm(self.sampleSourceKey());
        };


        self.newValSample = function () {
            if (self.sampleName().length >= 32) {
                self.errorMessage('Name must be less than 32 characters');
            } else {
                self.errorMessage('');
                ValidationService.createValidationSet(self.sampleSourceKey(),self.sampleSize(), self.sampleName(), id, self.getSamples)
            }
        };

        self.fixSamples = function(index) {
            if (self.display_sample().length > 0) {
                self.display_sample.removeAll();
            }
            for (var i = 0; i< self.samples()[index()].sample().length; i++) {
                self.display_sample.push(self.samples()[index()].sample()[i])
            }  
        };

        self.getSamples = function() {
            ValidationService.getSamples(self.sampleSourceKey(), id).then((data) => {
                var samples = [];
                for (var i = 0; i < data.length; i++) {
                    var row = {'name': null, 'size':null, 'annotated':null};
                    row['name'] = data[i][0];
                    row['size'] = data[i][1];
                    row['annotated'] = data[i][2];
                    var name = '';
                    if (row['name'].indexOf(' ') >=0) {
                        name = row['name'].split(" ").join('_');
                    } else {
                        name = row['name'];
                    }
                    row['url'] = window.location.origin + '/#/profiles/' + self.sampleSourceKey() + '/' + data[i][3] + '/' + id + '/' + name
                    var sample = ko.observableArray([]);
                    for (var j=0; j < data[i][4].length; j++) {
                        sample.push({'id':data[i][4][j][0], 
                                    'ann': data[i][4][j][1],
                                    "url": window.location.origin + '/#/profiles/' + self.sampleSourceKey() + '/' + data[i][4][j][0] + '/' + id + '/' + name})
                    }
                    row['sample'] = sample;
                    samples.push(row);
                }
                self.samples(samples);
            });
        };

        self.exportAnnotations = function(sampleName) {
            ValidationService.exportAnnotation(self.sampleSourceKey(), id, sampleName).then((data) => {
                var questions=data[0][2][0].questions;
				var subjects=data.slice(1);
				var rows = [];
				for (var i = 0; i < subjects.length;i++) {
					for (var j = 0; j < questions.length;j++) {
						var row = {'Source': self.sampleSourceKey(), "Cohort ID" : id, 'Question Set Name': self.questionSet.qsetName(),
								'Validation Set Name': sampleName, 'Patient ID': subjects[i][0], 'Question Type': questions[j].type,
								'Case Question': questions[j].caseQuestion, "Required": questions[j].required, "Question Text": questions[j].text}
						var answer = subjects[i][1][j];
						if (answer.length === 0) {
						    row['Answer'] = null;
						} else {
							if (answer === 1) {
								row['Answer'] = true;
							} else if (answer === 0) {
								row['Answer'] = false;
							} else if (answer.length > 0) {
								row['Answer'] = answer.toString();
							} else {
								row['Answer'] = answer;
							}
									
						}
						rows.push(row);
					}
				}
			    CsvUtils.saveAsCsv(rows);
            });
        };
    }
    ValidationTool.prototype.constructor = ValidationTool;
    return ValidationTool;
    
});