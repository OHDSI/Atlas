define(['knockout', 'services/Validation', 'services/Annotation', './QuestionSet', 'utils/CsvUtils'], function (ko, ValidationService, annotationService, QuestionSet, CsvUtils) {
    function ValidationTool(id, cohortName) {
        var self = this;
        var DEFAULT_VALIDATION_VIEW = 'show_qsets';
        var NEW_QUESTION_SET_VIEW = 'new_qset';
        var SELECTED_QUESTION_SET_VIEW = 'selected_qset';

        self.default_view = DEFAULT_VALIDATION_VIEW;

        self.cohortId = id;
        self.valTabMode = ko.observable(DEFAULT_VALIDATION_VIEW);
        self.showCreateValidationSet = ko.observable(false);
        self.errorMessage = ko.observable('');

        self.sampleSourceKey = ko.observable();
        self.sampleSize = ko.observable();
        self.sampleName = ko.observable();
        self.samples = ko.observableArray([]);
        self.display_sample = ko.observableArray([]);

        self.clickedSet = ko.observable();

        self.validationAnnotationSetsLoading = ko.observable(false);
        self.validationAnnotationSets = ko.observableArray([]);
        self.rawAnnotationSets = ko.observableArray([]);

        self.validationAnnotationSetCols = [
            {
                title: 'Annotation Set ID',
                data: 'id'
            },
            {
                title: 'Name',
                data: 'name'
            },
            {
                title: '# Questions',
                data: 'q_num'
            },
            {
                title: 'Actions',
                sortable: false,
                render: function() {
                    return `<button class="btn btn-primary btn-sm annotation-set-view-btn" >View</button> <button class="btn btn-danger btn-sm annotation-set-delete-btn" ><i class="fa fa-trash"></i> Delete</button>`;
                }
            }
        ];

        self.filterSet = ko.computed(function() {
            if(!self.clickedSet()) {
                return undefined;
            } else {
                return ko.utils.arrayFilter(self.rawAnnotationSets(), function(s) {
                    return s.id === self.clickedSet();
                });
            }
        });

        self.onValidationAnnotationListClick = function(d, e) {
            self.clickedSet(d.id);
            const items = self.filterSet();
            if (items !== undefined && items.length > 0) {
                var result = items[0];
                if (e.target.className === 'btn btn-primary btn-sm annotation-set-view-btn') {
                    // id, cohortName, qSetId, qSetName, qSetQuestions, mode
                    self.questionSet = new QuestionSet(id, cohortName, result.id, result.name, result.questions, 'VIEW');
                    setTimeout(() => {
                        self.questionSet.showSelectedQset();
                        self.valTabMode(SELECTED_QUESTION_SET_VIEW);
                        // if you don't do this, ko complains.
                    }, 750);
                } else if (e.target.className === 'btn btn-danger btn-sm annotation-set-delete-btn') {
                    console.log('delete it');
                }
            }

        };

        self.loadAnnotationSets = function() {
            self.validationAnnotationSetsLoading(true);
            var annotationSet = annotationService.getAnnotationSets(self.cohortId)
                .catch(() => {
                    console.error('Error when refreshing annotation sets, please try again later');
                });
            if (annotationSet !== undefined) {
                annotationSet.then(res => {
                        self.rawAnnotationSets(res);
                        var transformAnnotationSets = res.map(el => ({
                            id: el.id,
                            q_num: el.questions.length,
                            name: el.name
                        }));
                        self.validationAnnotationSets(transformAnnotationSets);
                    }).finally(() => {
                        self.validationAnnotationSetsLoading(false);
                    });

            }

        };

        self.valTabMode.subscribe(function (mode) {
            if (mode === DEFAULT_VALIDATION_VIEW) {
                self.loadAnnotationSets();
            }
        });

        self.addQuestionSet = function() {
            self.questionSet = new QuestionSet(id, cohortName, null, null, [], 'NEW');
            self.valTabMode(NEW_QUESTION_SET_VIEW);
        };


        self.submitQsetForm = function () {
            const submitted = self.questionSet.submitQsetForm(self.sampleSourceKey());
            if (submitted !== null) {
                setTimeout(() => {
                    submitted.then(res => {
                        self.valTabMode(DEFAULT_VALIDATION_VIEW);
                    });
                    // if you don't do this, ko complains.
                }, 500);
            }
        };

        self.newValSample = function () {
            if (self.sampleName().length >= 32) {
                self.errorMessage('Name must be less than 32 characters');
            } else {
                self.errorMessage('');
                ValidationService.createValidationSet(self.sampleSourceKey(),self.sampleSize(), self.sampleName(), id, self.getSamples);
            }
        };

        self.fixSamples = function(index) {
            if (self.display_sample().length > 0) {
                self.display_sample.removeAll();
            }
            for (var i = 0; i< self.samples()[index()].sample().length; i++) {
                self.display_sample.push(self.samples()[index()].sample()[i]);
            }
        };

        self.getSamples = function() {
            ValidationService.getSamples(self.sampleSourceKey(), id).then(function (data) {
                var samples = [];
                for (var i = 0; i < data.length; i++) {
                    var row = {'name': null, 'size': null, 'annotated': null};
                    row['name'] = data[i][0];
                    row['size'] = data[i][1];
                    row['annotated'] = data[i][2];
                    var name = '';
                    if (row['name'].indexOf(' ') >= 0) {
                        name = row['name'].split(" ").join('_');
                    } else {
                        name = row['name'];
                    }
                    row['url'] = window.location.origin + '/#/profiles/' + self.sampleSourceKey() + '/' + data[i][3] + '/' + id + '/' + name;
                    var sample = ko.observableArray([]);
                    for (var j = 0; j < data[i][4].length; j++) {
                        sample.push({
                            'id': data[i][4][j][0],
                            'ann': data[i][4][j][1],
                            "url": window.location.origin + '/#/profiles/' + self.sampleSourceKey() + '/' + data[i][4][j][0] + '/' + id + '/' + name
                        });
                    }
                    row['sample'] = sample;
                    samples.push(row);
                }
                self.samples(samples);
            });
        };

        self.exportAnnotations = function(sampleName) {
            ValidationService.exportAnnotation(self.sampleSourceKey(), id, sampleName).then(function (data) {
                var questions = data[0][2][0].questions;
                var subjects = data.slice(1);
                var rows = [];
                for (var i = 0; i < subjects.length; i++) {
                    for (var j = 0; j < questions.length; j++) {
                        var row = {
                            'Source': self.sampleSourceKey(),
                            "Cohort ID": id,
                            'Question Set Name': self.questionSet.qsetName(),
                            'Validation Set Name': sampleName,
                            'Patient ID': subjects[i][0],
                            'Question Type': questions[j].type,
                            'Case Question': questions[j].caseQuestion,
                            "Required": questions[j].required,
                            "Question Text": questions[j].text
                        };
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


        self.questionSet = new QuestionSet(id, cohortName, null, null, [], 'NEW');
        self.loadAnnotationSets();
    }
    ValidationTool.prototype.constructor = ValidationTool;
    return ValidationTool;
    
});