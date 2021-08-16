define(['knockout', 'services/Validation', 'services/Annotation', './QuestionSet', 'utils/CsvUtils', 'services/Sample'],
    function (ko, ValidationService, annotationService, QuestionSet, CsvUtils, sampleService) {
    function ValidationTool(id, cohortName, sourceStatus, reportSource, sampleSource) {
        var self = this;
        var DEFAULT_VALIDATION_VIEW = 'show_qsets';
        var NEW_QUESTION_SET_VIEW = 'new_qset';
        var SELECTED_QUESTION_SET_VIEW = 'selected_qset';

        self.default_view = DEFAULT_VALIDATION_VIEW;

        self.cohortId = id;
        self.valTabMode = ko.observable(DEFAULT_VALIDATION_VIEW);
        self.showCreateValidationSet = ko.observable(false);
        self.errorMessage = ko.observable('');

        if (!sampleSource) {
            let k = Object.keys(sourceStatus);
            if (k.length === 1) {
                sampleSource = k[0];
            }
        }

        if (!sampleSource && reportSource) {
            sampleSource = reportSource;
        }

        self.sampleSourceKey = ko.observable(sampleSource);
        self.sampleSize = ko.observable();
        self.sampleName = ko.observable();
        self.samples = ko.observableArray([]);
        self.display_sample = ko.observableArray([]);

        self.clickedSet = ko.observable();

        self.validationAnnotationSetsLoading = ko.observable(false);
        self.validationAnnotationSets = ko.observableArray([]);
        self.rawAnnotationSets = ko.observableArray([]);

        self.annotationStudySets = ko.observableArray([]);
        self.annotationStudiesLoading = ko.observable(false);

        self.studyResultsModalShown = ko.observable(false);
        self.studyResultsLoading = ko.observable(false);
        self.studySetResults = ko.observableArray([]);
        self.selectResult = ko.observable();

        self.questionSet = new QuestionSet(id, cohortName, null, null, [], 'NEW');

        self.annotationSampleLoading = ko.observable(false);
        self.annotationSampleLinkShown = ko.observable(false);
        self.isSampleLinking = ko.observable(false);
        self.sampleSets = ko.observableArray([]);

        self.validationAnnotationSetCols = [
            {
                title: 'ID',
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
                    return `<button class="btn btn-primary btn-sm annotation-set-samples-btn" ><i class="fa fa-table"></i> Create Study</button> <button class="btn btn-success btn-sm annotation-set-view-btn" ><i class="fa fa-info"></i> View Set Detail</button> <button disabled="true" class="disabled btn btn-danger btn-sm annotation-set-delete-btn"><i class="fa fa-trash"></i> Delete</button>`;
                }
            }
        ];

        self.annotationStudySetCols = [
            {
                title: 'Set ID',
                data: 'questionSetId'
            },
            {
                title: 'Set Name',
                data: 'questionSetName'
            },
            {
                title: 'Sample ID',
                data: 'cohortSampleId'
            },
            {
                title: 'Sample Name',
                data: 'cohortSampleName'
            },
            {
                title: 'Actions',
                sortable: false,
                render: function() {
                    return `<button class="btn btn-primary btn-sm annotation-study-launch-btn" ><i class="fa fa-arrow-circle-right"></i> Launch Study</button> <button class="btn btn-success btn-sm annotation-study-view-btn" ><i class="fa fa-table"></i> View Results</button>`;
                }
            }

        ];
        self.studySetResultCols = [
            {
                title: 'Cohort ID',
                data: 'cohortId'
            },
            {
                title: 'Cohort Name',
                data: 'cohortName'
            },
            {
                title: 'Source',
                data: 'dataSourceId'
            },
            {
                title: 'Sample ID',
                data: 'cohortSampleId'
            },
            {
                title: 'Sample Name',
                data: 'cohortSampleName'
            },
            {
                title: 'Set ID',
                data: 'questionSetId'
            },
            {
                title: 'Set Name',
                data: 'questionSetName'
            },
            {
                title: 'Patient',
                data: 'patientId'
            },
            {
                title: 'Question',
                data: 'questionText'
            },
            {
                title: 'Answer',
                data: 'value'
            },
            {
                title: 'Case Status',
                data: 'caseStatus'
            }
        ];

        self.sampleCols = [
            {
                title: 'ID',
                data: 'id'
            },
            {
                title: 'Sample Name',
                data: 'name'
            },
            {
                title: 'Sample Size',
                data: 'size',
            },
            {
                title: 'Actions',
                sortable: false,
                render: function() {
                    return `<button class="btn btn-success btn-sm sample-study-launch-btn" ><i class="fa fa-arrow-circle-right"></i> Launch Study</button><span class="sample-status">`;
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

        self.getSampleList = function(cohortDefinitionId, sourceKey) {
            this.annotationSampleLoading(true);
            this.annotationSampleLinkShown(true);
            sampleService.getSampleList({cohortDefinitionId, sourceKey})
                .then(res => {
                    if(res.generationStatus !== "COMPLETE") {
                        alert('Cohort should be generated before creating samples');
                        return;
                    }
                    const sampleListData = res.samples;
                    this.sampleSets(sampleListData);
                })
                .catch(error=>{
                    console.error(error);
                    alert('Error when fetching sample list, please try again later');
                })
                .finally(() => {
                    this.annotationSampleLoading(false);
                });
        };



        self.onSampleRowClick = function(d, e) {
            const sampleId = d['id'];
            const sourceKey = self.sampleSourceKey();
            const cohortDefinitionId = self.cohortId;
            if (e.target.className === "btn btn-success btn-sm sample-study-launch-btn") {
                self.isSampleLinking(true);
                const btn = e.target;
                const status = btn.nextSibling;
                status.textContent = "Retrieving study information...";
                btn.disabled = true;
                annotationService.getSetsBySampleId(sampleId)
                    .then((items) => {
                        return items.includes(d['id']);
                    })
                    .then((linked) => {
                        if (linked) {
                            status.textContent = "Launching study...";
                            annotationService.getAnnotationsBySampleIdSetId(sampleId, d.id)
                                .then((items) => {
                                    if (items.length > 0) {
                                        window.location = `#/profiles/${sourceKey}/${items[0].subjectId}/${cohortDefinitionId}/${sampleId}`;
                                        location.reload();
                                    } else {
                                        console.error(error);
                                        status.textContent = "Error launching study!";
                                        btn.disabled = false;
                                        alert('Error launching sample to annotations. Please try again later.');
                                    }
                                })
                                .catch(error=>{
                                    console.error(error);
                                    status.textContent = "Error launching study!";
                                    btn.disabled = false;
                                    alert('Error launching sample to annotations. Please try again later.');
                                })
                                .finally(() => {
                                    self.isSampleLinking(false);
                                    self.annotationSampleLinkShown(false);
                                })
                        }
                        else {
                            status.textContent = "Creating study...";
                            annotationService.linkAnnotationToSamples({
                                'sampleId': sampleId,
                                'cohortDefinitionId': cohortDefinitionId,
                                'sourceKey': sourceKey,
                                'annotationSetId': d.id
                            })
                                .then(res => {
                                    status.textContent = "Launching Study...";
                                    console.log('posted annotation sample link');
                                    console.log(res);
                                    annotationService.getAnnotationsBySampleIdSetId(sampleId, d.id)
                                        .then((items) => {
                                            if (items.length > 0) {
                                                window.location = `#/profiles/${sourceKey}/${items[0].subjectId}/${cohortDefinitionId}/${sampleId}`;
                                                location.reload();
                                            } else {
                                                console.error(error);
                                                status.textContent = "Error launching study!";
                                                btn.disabled = false;
                                                alert('Error launching sample to annotations. Please try again later.');
                                            }
                                        })
                                        .catch(error=>{
                                            console.error(error);
                                            status.textContent = "Error launching study!";
                                            btn.disabled = false;
                                            alert('Error launching sample to annotations. Please try again later.');
                                        })
                                        .finally(() => {
                                            self.isSampleLinking(false);
                                            self.annotationSampleLinkShown(false);
                                        })
                                })
                                .catch(error=>{
                                    console.error(error);
                                    status.textContent = "Error creating study!";
                                    btn.disabled = false;
                                    alert('Error linking sample to annotations. Please try again later.');
                                })
                                .finally(() => {
                                    self.isSampleLinking(false);
                                    self.annotationSampleLinkShown(false);
                                });
                        }
                    });
            }
        };

        self.onValidationAnnotationListClick = function(d, e) {
            self.clickedSet(d.id);
            const items = self.filterSet();
            if (items !== undefined && items.length > 0) {
                var result = items[0];
                self.selectResult(result);
                if (e.target.className === 'btn btn-success btn-sm annotation-set-view-btn') {
                    self.valTabMode(SELECTED_QUESTION_SET_VIEW);
                } else if (e.target.className === 'btn btn-danger btn-sm annotation-set-delete-btn') {
                    console.log('delete not yet implemented');
                } else if (e.target.className === 'btn btn-primary btn-sm annotation-set-samples-btn') {
                    self.getSampleList(self.cohortId, self.sampleSourceKey());
                }
            }

        };

        self.onAnnotationStudyListClick = function(d, e) {
            var questionSetId = d.questionSetId;    
            var cohortSampleId = d.cohortSampleId;


            if (e.target.className === "btn btn-success btn-sm annotation-study-view-btn") {
                self.studyResultsLoading(true);
                self.studyResultsModalShown(true);
                var superTable = annotationService.getSuperTable(questionSetId, cohortSampleId)
                    .catch(() => {
                        console.error('Error when loading super table results, please try again later');
                    });
                if (superTable !== undefined) {
                    superTable.then(res => {
                        //var filtered = res.filter(r => (r.cohortSampleId === cohortSampleId && r.questionSetId === questionSetId));
                        var mapped = res.map((r) => {
                            r['dataSourceId'] =  r['dataSourceKey'];
                            r['cohortSampleId'] = cohortSampleId;
                            r['questionSetId'] = questionSetId;
                            return r;
                        });
                        self.studySetResults(mapped);

                    }).finally(() => {
                        self.studyResultsLoading(false);
                    });
                }
            } else if (e.target.className === "btn btn-primary btn-sm annotation-study-launch-btn") {
                annotationService.getAnnotationsBySampleIdSetId(cohortSampleId, questionSetId)
                    .then((items) => {
                        if (items.length > 0) {
                            let item = items[0];
                            let source = self.sampleSourceKey();
                            if (!source) {
                                alert('Please select a source from the Samples tab');
                            } else {

                                window.open(`#/profiles/${source}/${item.subjectId}/${self.cohortId}/${cohortSampleId}`);
                            }

                        }
                    });

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

        self.loadStudySets = function() {

            self.annotationStudiesLoading(true);
            var studySet = annotationService.getStudySets(self.cohortId)
                .catch(() => {
                    console.error('Error when refreshing study sets, please try again later');
                });
            if (studySet !== undefined) {
                studySet.then(res => {
                    self.annotationStudySets(res);
                }).finally(() => {
                    self.annotationStudiesLoading(false);
                });
            }
        };

        self.valTabMode.subscribe(function (mode) {
            if (mode === DEFAULT_VALIDATION_VIEW) {
                self.loadAnnotationSets();
                self.loadStudySets();
            } else if (mode === SELECTED_QUESTION_SET_VIEW) {
                let result = self.selectResult();
                self.questionSet.resetValues(id, cohortName, result.id, result.name, result.questions, 'VIEW');

            }
        });

        self.addQuestionSet = function() {
            self.questionSet.resetValues(id, cohortName, null, null, [], 'NEW');
            // self.questionSet.initialize();
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


        self.loadAnnotationSets();
        self.loadStudySets();
    }
    ValidationTool.prototype.constructor = ValidationTool;
    return ValidationTool;
    
});