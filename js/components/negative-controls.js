define(['knockout',
        'text!./negative-controls.html',
        'appConfig',
        'webapi/EvidenceAPI',
        'webapi/CDMResultsAPI',
        'webapi/ConceptSetAPI',
        'lodash', 
        'crossfilter/crossfilter',
        'ohdsi.util',
        'knockout.dataTables.binding',
        'components/faceted-datatable-cf',
        'databindings'
], function (ko, view, config, evidenceAPI, cdmResultsAPI, conceptSetAPI, lodash, crossfilter) {
    function negativeControls(params) {
        var self = this;

        var pollTimeout = null;
        self.model = params.model;
        self.selectedConcepts = params.selectedConcepts;
        self.conceptSet = params.conceptSet;
        self.conceptIds = params.conceptIds;
        self.services = params.services;
        self.defaultResultsUrl = params.defaultResultsUrl;
        self.negativeControls = params.negativeControls;
        self.dirtyFlag = params.dirtyFlag;
        self.conceptSetValid = ko.observable(false);
        self.conceptDomainId = ko.observable(null);
        self.targetDomainId = ko.observable(null);
        self.currentEvidenceService = ko.observable();
        self.currentResultSource = ko.observable();
        self.loadingResults = ko.observable(false);
        self.evidenceSources = ko.observableArray();
        self.loadingEvidenceSources = ko.observable(false);
        self.selectedReportCaption = ko.observable();
        
        // Cross filter settings
        self.crossfilter = ko.observable();
        self.filtersChanged = ko.observable();
        self.filteredRecs = ko.observableArray([]);
        self.facetsObs = ko.observableArray([]);
        // TODO: Make the func: filter a function that would actually
        // return the filters we want to use for negative/positive controls.
        self.dimensions = {
            'Controls': {
                caption: 'Subset to candidate',
                //func: d => d.domainId,
                func: function(d) { 
                    if (d.medlineCt == 0 && 
                        d.medlineCase == 0 && 
                        d.medlineOther == 0 &&
                        d.splADR == 0 &&
                        d.aersPRR.toFixed(2) < 2.00 &&
                        d.prediction.toFixed(2) < 0.10) {
                        return 'Negative Controls';                         
                    } else if (d.prediction.toFixed(2) > 0.80) {
                    	return 'Positive Controls'
                    } else {
                    	return 'All Other Controls'
                    }
                },
                filter: ko.observable(null),
                Members: [], //ko.observableArray([{Name:'foo', ActiveCount:'bar',Selected:false}]),
            }			
        };        
        var reduceToRecs = [(p, v, nf) => p.concat(v), (p, v, nf) => _.without(p, v), () => []];
        self.facets = ['Controls'].map(d => self.dimensions[d]);
        
        
        self.reportColumns = [
                        {
                            title: 'Id',
                            data: 'conceptId'
                        },
                        {
                            title: 'Name',
                            data: 'conceptName',
                            render: function (s, p, d) {
                                var valid = true; //d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
                                return '<a class=' + valid + ' href=\'#/concept/' + d.conceptId + '\'>' + d.conceptName + '</a>';
                            }
                        },
                        {
                            title: 'Domain',
                            data: 'domainId'
                        },
                        {
                            title: 'Medline CT',
                            data: 'medlineCt',
                            render: $.fn.dataTable.render.number( ',','.', 0)
                        },
                        {
                            title: 'Medline Case',
                            data: 'medlineCase',
                            render: $.fn.dataTable.render.number( ',','.', 0)
                        },
                        {
                            title: 'Medline Other',
                            data: 'medlineOther',
                            render: $.fn.dataTable.render.number( ',','.', 0)
                        },
                        {
                            title: 'SemMedDB CT (True)',
                            data: 'semmeddbCtT',
                            visible: false,
                            render: $.fn.dataTable.render.number( ',','.', 0)
                        },
                        {
                            title: 'SemMedDB Case (True)',
                            data: 'semmeddbCaseT',
                            visible: false,
                            render: $.fn.dataTable.render.number( ',','.', 0)
                        },
                        {
                            title: 'SemMedDB Other (True)',
                            data: 'semmeddbOtherT',
                            visible: false,
                            render: $.fn.dataTable.render.number( ',','.', 0)
                        },
                        {
                            title: 'SemMedDB CT (False)',
                            data: 'semmeddbCtF',
                            visible: false,
                            render: $.fn.dataTable.render.number( ',','.', 0)
                        },
                        {
                            title: 'SemMedDB Case (False)',
                            data: 'semmeddbCaseF',
                            visible: false,
                            render: $.fn.dataTable.render.number( ',','.', 0)
                        },
                        {
                            title: 'SemMedDB Other (False)',
                            data: 'semmeddbOtherF',
                            visible: false,
                            render: $.fn.dataTable.render.number( ',','.', 0)
                        },
                        {
                            title: 'EU SPC',
                            data: 'euSPC',
                            visible: false,
                            render: $.fn.dataTable.render.number( ',','.', 0)
                        },
                        {
                            title: 'EU SPC',
                            data: 'euSPC',
                            visible: false,
                            render: $.fn.dataTable.render.number( ',','.', 0)
                        },
                        {
                            title: 'Splicer ADR',
                            data: 'splADR',
                            render: $.fn.dataTable.render.number( ',','.', 0)
                        },
                        {
                            title: 'AERS',
                            data: 'aers',
                            render: $.fn.dataTable.render.number( ',','.', 0)
                        },
                        {
                            title: 'AERS PRR',
                            data: 'aersPRR',
                            render: $.fn.dataTable.render.number( ',','.', 4)
                        },
                        {
                            title: 'Prediction',
                            data: 'prediction',
                            render: function (data) {
                                return (Math.ceil(data * 1000) / 1000).toFixed(4);
                            }
                        },
                        {
                            title: 'RC',
                            data: 'recordCount'
                        },
                        {
                            title: 'DRC',
                            data: 'descendantRecordCount'
                        }
                ];
        self.reportOptions = {
            Facets: [{
				'caption': 'Test',
				'binding': function (o) {
					return o.VOCABULARY_ID;
				}
            }],
            dom: 'Blfiprt',
            language: {
                search : 'Filter Rows:'
            },
            buttons: [
                        'colvis','copyHtml5','excelHtml5','csvHtml5','pdfHtml5'
            ],
            colVis: {
                buttonText: 'Change Columns',
                align: 'right',
                overlayFade: 0,
                showAll: 'Show All Columns',
                restore: 'Reset Columns'
            },
            lengthMenu: [[25, 50, 100, -1], [25, 50, 100,'All']],
            orderClasses: false,
            deferRender: true,
            autoWidth: false,
            order: [[17, 'asc'], [18, 'desc']]
        };

        self.selectedConceptsSubscription = self.selectedConcepts.subscribe(function (newValue) {
            if (newValue != null) {
                self.evaluateConceptSet();
            }
        });

        self.isRunning = ko.pureComputed(function() {
            return self.evidenceSources().filter(function (info) {
                return !(info.status() == "COMPLETE" || info.status() == "n/a") ;
            }).length > 0;
		});
        
		self.getSourceInfo = function (sourceKey) {
			return self.evidenceSources().filter(function (d) {
				return d.sourceKey() == sourceKey
			})[0];
		}
        
		self.canGenerate = ko.pureComputed(function () {
			var isDirty = self.dirtyFlag() && self.dirtyFlag().isDirty();
			var isNew = self.model.currentConceptSet() && (self.model.currentConceptSet().id == 0);
			var canGenerate = !(isDirty || isNew);
			return (canGenerate);
		});
        

        self.pollForInfo = function () {
            if (pollTimeout)
                clearTimeout(pollTimeout);

            var id = self.conceptSet().id;
            conceptSetAPI.getGenerationInfo(id).then(function (infoList) {
                var hasPending = false;
                console.log("poll for evidence....")

                infoList.forEach(function (info) {
                    // obtain source reference
                    var source = self.evidenceSources().filter(function (s) {
                        return s.sourceId() == info.sourceId
                    })[0];

                    if (source) {
                        // only bother updating those sources that we know are running
                        if (self.isSourceRunning(source)) {                            
                            source.status(info.status);
                            source.isValid(info.isValid);
                            var date = new Date(info.startTime);
                            source.startTime(date.toLocaleDateString() + ' ' + date.toLocaleTimeString());
                            source.executionDuration('...');

                            if (info.status != "COMPLETE") {
                                hasPending = true;
                            } else {
                                source.executionDuration((info.executionDuration / 1000) + 's');
                            }
                        }
                    }
                });

                if (hasPending) {
                    pollTimeout = setTimeout(function () {
                        self.pollForInfo();
                    }, 5000);
                }
            });
        }

        self.generate = function (service, event) {
            // Check to make sure the concept set is valid before calling the service
            if (!self.conceptSetValid()) {
                alert("The concept set is not marked as valid to generate results. Please make sure this concept set contains only CONDITIONS or DRUGS.");
                return;
            }

            // Call the ajax service to generate the results
            var negativeControlsJob = evidenceAPI.generateNegativeControls(service.sourceKey(), self.conceptSet().id, self.conceptSet().name(), self.conceptDomainId(), self.targetDomainId(), self.conceptIds());

            // Mark as pending results
            self.getSourceInfo(service.sourceKey()).status('PENDING');
            
            // Kick the job off 
            $.when(negativeControlsJob).done(function(jobInfo) {
               pollTimeout = setTimeout(function () {
                        self.pollForInfo();
                    }, 3000);     
            });
        }

        self.isGenerating = function () {
            return false;
        }

        self.evaluateConceptSet = function () {
            // Determine if all of the concepts in the current concept set
            // are all of the same type (CONDITION or DRUG) and if so, this
            // concept set is valid and can be evaluated for negative controls
            var conceptSetValid = false;
            var conceptDomainId = null;
            var targetDomainId = null;
            var conceptSetLength = self.selectedConcepts().length;
            var conditionLength = self.selectedConcepts().filter(function (elem) {
                return elem.concept.DOMAIN_ID == "Condition";
            }).length;
            var drugLength = self.selectedConcepts().filter(function (elem) {
                return elem.concept.DOMAIN_ID == "Drug";
            }).length;

            if (conceptSetLength > 0) {
                if (conditionLength == conceptSetLength) {
                    conceptSetValid = true;
                    conceptDomainId = "Condition";
                    targetDomainId = "Drug";
                } else if (drugLength == conceptSetLength) {
                    conceptSetValid = true;
                    conceptDomainId = "Drug";
                    targetDomainId = "Condition";
                }
            }
            self.conceptSetValid(conceptSetValid);
            self.conceptDomainId(conceptDomainId);
            self.targetDomainId(targetDomainId);
        }

        self.getEvidenceSourcesFromConfig = function () {
            evidenceSources = [];
            $.each(config.services, function (sourceIndex, service) {
                console.log(service);
                $.each(service.sources, function (i, source) {
                    if (source.hasEvidence) {
                        var sourceInfo = {};
                        sourceInfo.sourceId = ko.observable(source.sourceId);
                        sourceInfo.sourceKey = ko.observable(source.sourceKey);
                        sourceInfo.sourceName = ko.observable(source.sourceName);
                        sourceInfo.startTime = ko.observable("n/a");
                        sourceInfo.executionDuration = ko.observable("n/a");
                        sourceInfo.status = ko.observable("n/a");
                        sourceInfo.isValid = ko.observable(false);

                        evidenceSources.push(sourceInfo);
                    }
                })
            });
            return evidenceSources;
        }

        self.getEvidenceSources = function () {
            self.loadingEvidenceSources(true);
            var resolvingPromise = conceptSetAPI.getGenerationInfo(self.conceptSet().id);
            $.when(resolvingPromise).done(function (generationInfo) {
                var evidenceSources = self.getEvidenceSourcesFromConfig();
                $.each(evidenceSources, function (i, evidenceSource) {
                    var gi = $.grep(generationInfo, function (a) {
                        return a.sourceId == evidenceSource.sourceId();
                    });
                    if (gi.length > 0) {
                        var date = new Date(gi[0].startTime);
                        var execDuration = (gi[0].executionDuration / 1000) + 's'
                        evidenceSources[i].startTime(date.toLocaleDateString() + ' ' + date.toLocaleTimeString());
                        evidenceSources[i].executionDuration(execDuration);
                        evidenceSources[i].status(gi[0].status);
                        evidenceSources[i].isValid(gi[0].isValid);

                        if (gi[0].status == "RUNNING") {
                            self.pollForInfo();
                        }
                    }
                });
                self.evidenceSources(evidenceSources);
                self.loadingEvidenceSources(false);
            });
        };

        self.resultSources = ko.computed(function () {
            var resultSources = [];
            $.each(config.services, function (sourceIndex, service) {
                console.log(service);
                $.each(service.sources, function (i, source) {
                    if (source.hasResults) {
                        resultSources.push(source);
                        if (source.resultsUrl == self.defaultResultsUrl()) {
                            self.currentResultSource(source);
                        }
                    }
                })
            });

            return resultSources;
        }, this);

        self.loadResults = function (service) {
            self.loadingResults(true);
            self.currentEvidenceService(service);
            self.selectedReportCaption(service.name);
            evidenceAPI.getNegativeControls(service.sourceKey(), self.conceptSet().id).then(function (results) {
                console.log("Get negative controls");
                var conceptIdsForNegativeControls = $.map(results, function (o, n) {
                    return o.conceptId;
                });
                cdmResultsAPI.getConceptRecordCount(self.currentResultSource().sourceKey, conceptIdsForNegativeControls, results).then(function (rowcounts) {
                    self.negativeControls(results);
                    self.crossfilter(crossfilter(results));
                    self.loadingResults(false);
                });
            });
        }
        
		self.isSourceRunning = function (source) {
			if (source) {
				switch (source.status()) {
				case 'COMPLETE':
					return false;
					break;
				case 'n/a':
					return false;
					break;
				default:
					return true;
				}
			} else {
				return false;
			}
		}        
        
        self.filtersChanged.subscribe(() => {
				var groupAll = self.crossfilter().groupAll();
				groupAll.reduce(...reduceToRecs);
				self.filteredRecs(groupAll.value());
		});
        
        self.crossfilter.subscribe(cf => {
            _.each(self.dimensions, dim => {
                dim.dimension = cf.dimension(dim.func);
                dim.filter(null);
                dim.group = dim.dimension.group();
                dim.group.reduce(...reduceToRecs);
                dim.groupAll = dim.dimension.groupAll();
                dim.groupAll.reduce(...reduceToRecs);
                //dim.recs(dim.groupAll.value());
            });
            self.facets.forEach(facet => {
                facet.Members = [];
            });
            self.facetsObs.removeAll();
            self.facetsObs.push(...self.facets);
            var groupAll = self.crossfilter().groupAll();
            groupAll.reduce(...reduceToRecs);
            self.filteredRecs(groupAll.value());
        });
        

        // Evalute the concept set when this component is loaded
        self.evaluateConceptSet();

        // Get the evidence sources
        self.getEvidenceSources();
        
        // Init the crossfilter observable
        self.crossfilter(crossfilter([]));
        _.each(self.dimensions, dim => {
            dim.filter.subscribe(filter => {
                dim.dimension.filter(filter);
                self.filtersChanged(filter);
            });
        });
    }

    var component = {
        viewModel: negativeControls,
        template: view
    };

    ko.components.register('negative-controls', component);
    return component;
});