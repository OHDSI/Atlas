define(['knockout', 
        'text!./conceptset-manager.html', 
        'appConfig', 
        'ohdsi.util', 
        'webapi/CDMResultsAPI',
        'vocabularyprovider',
        'conceptsetbuilder/InputTypes/ConceptSet',
        'knockout.dataTables.binding', 
        'bootstrap',
        'faceted-datatable', 
        'databindings', 
        'negative-controls',
        'circe',
], function (ko, view, config, ohdsiUtil, cdmResultsAPI, vocabularyAPI, ConceptSet) {
	function conceptsetManager(params) {
		var self = this;
		self.model = params.model;
		self.conceptSetName = ko.observable();
		self.conceptSets = ko.observableArray();
		self.defaultConceptSetName = "New Concept Set";
        self.displayEvidence = ko.pureComputed(function () {
                                    return (self.model.evidenceUrl() && self.model.evidenceUrl().length > 0);
                                });
        self.activeUtility = ko.observable("");
        self.loading = ko.observable(false);
        self.optimalConceptSet = ko.observable(null);
        self.optimizerRemovedConceptSet = ko.observable(null);
        self.optimizerSavingNew = ko.observable(false);
        self.optimizerSavingNewName = ko.observable();
        self.optimizerFoundSomething = ko.pureComputed(function() {
            var returnVal = false;
            if (self.optimalConceptSet() && 
                self.optimalConceptSet().length > 0 && 
                self.model.selectedConcepts() &&
                self.model.selectedConcepts().length > 0)
                {
                    returnVal = self.optimalConceptSet().length != self.model.selectedConcepts().length;
                }
            return returnVal;
        })
        // Set the default concept set to be the current concept set
        self.currentConceptSet = ko.observableArray();
        _.each(self.model.selectedConcepts(), (conceptSetItem) => {
            var item = {
                concept: conceptSetItem.concept,
                includeDescendants: conceptSetItem.includeDescendants(),
                includeMapped: conceptSetItem.includeMapped(),
                isExcluded: conceptSetItem.isExcluded(),
            }
            self.currentConceptSet().push(item);
        });            	
        self.compareCS1Id = ko.observable(self.model.currentConceptSet().id); // Init to the currently loaded cs
        self.compareCS1Caption = ko.observable(self.model.currentConceptSet().name());
        self.compareCS1ConceptSet = ko.observableArray(self.currentConceptSet());
        self.compareCS2Id = ko.observable();
        self.compareCS2Caption = ko.observable();
        self.compareCS2ConceptSet = ko.observableArray(null);
        self.compareError = ko.pureComputed(function() {
            return (self.compareCS1Id() == self.compareCS2Id())
        });
        self.compareReady = ko.pureComputed(function() {
            // both are specified & not the same
            return (
                    (self.compareCS1Id() > 0 && self.compareCS2Id() > 0) &&
                    (self.compareCS1Id() != self.compareCS2Id())
                   )
        });
        self.compareResults = ko.observable();
        self.compareNewConceptSetName = ko.observable(self.model.currentConceptSet().name() + " - From Comparison");
        self.defaultResultsUrl = self.model.resultsUrl;
        self.currentResultSource = ko.observable();
        self.recordCountsRefreshing = ko.observable(false);
        self.recordCountClass = ko.pureComputed(function() {
            return self.recordCountsRefreshing() ? "fa fa-circle-o-notch fa-spin fa-lg" : "fa fa-database fa-lg";
        });
        
        self.resultSources = ko.computed(function () {
            var resultSources = [];
            $.each(config.services, function (sourceIndex, service) {
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
        
        self.fields = {
            membership: {
                propName: 'conceptIn1And2',
                value: d => { 
                    if (d.conceptIn1Only == 1) {
                        return '1 Only'   
                    } else if (d.conceptIn2Only == 1) {
                    	return '2 Only'
                    } else {
                    	return 'Both'
                    }
                },
                isColumn: true,
                isFacet: true,
                label: 'Match',
                isField: true,
            },
            id: {
                propName: 'conceptId',
                value: 'conceptId',
                isColumn: true,
                isFacet: false,
                label: 'Id',
                isField: true,
            },
            code: {
                propName: 'conceptCode',
                value: 'conceptCode',
                isColumn: true,
                isFacet: false,
                label: 'Code',
                isField: true,
            },
            name: {
                propName: 'conceptName',
                value: d => {
                    var valid = true; //d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
                    return '<a class=' + valid + ' href=\'#/concept/' + d.conceptId + '\'>' + d.conceptName + '</a>';
                },
                isColumn: true,
                isFacet: false,
                label: 'Name',
                isField: true,
            },            
            class: {
                propName: 'conceptClassId',
                value: 'conceptClassId',
                isColumn: true,
                isFacet: true,
                label: 'Class',
                isField: true,
            },
            RC: {
                propName: 'recordCount',
                value: 'recordCount',
                isColumn: true,
                isFacet: false,
                label: '<i id="dtConeptManagerRC" class="fa fa-database" aria-hidden="true"></i> RC',
                isField: true,
            },
            DRC: {
                propName: 'descendantRecordCount',
                value: 'descendantRecordCount',
                isColumn: true,
                isFacet: false,
                label: '<i id="dtConeptManagerDRC" class="fa fa-database" aria-hidden="true"></i> DRC',
                isField: true,
            },
            domainId: {
                propName: 'domainId',
                value: 'domainId',
                isColumn: true,
                isFacet: true,
                label: 'Domain',
                isField: true,
            },        
            vocabularyId: {
                propName: 'vocabularyId',
                value: 'vocabularyId',
                isColumn: true,
                isFacet: true,
                label: 'Vocabulary',
                isField: true,
            },        
            fRC: {
                propName: 'fRecordCount',
                label: 'Has Records',
                value: d => {
                	var val = 0;
                	if (d.recordCount.replace) {
                		val = parseInt(d.recordCount.replace(/\,/g,'')); // Remove comma formatting and treat as int
                	} else {
                		val = d.recordCount;
                	}
                    if (val > 0) {
                        return 'true'
                    } else {
                        return 'false'
                    }
                },
                isField: true,
                isColumn: false,
                isFacet: true,
            },
            fDRC: {
                propName: 'fDescendantRecordCount',
                label: 'Has Descendant Records',
                value: d => {
                	var val = 0;
                	if (d.descendantRecordCount.replace) {
                		val = parseInt(d.descendantRecordCount.replace(/\,/g,'')); // Remove comma formatting and treat as int
                	} else {
                		val = d.descendantRecordCount;
                	}
                    if (val > 0) {
                        return 'true'
                    } else {
                        return 'false'
                    }
                },
                isField: true,
                isColumn: false,
                isFacet: true,
            },            
        }
        
		self.renderLink = function (s, p, d) {
			return '<a href=\"#/conceptset/' + d.id + '/details\">' + d.name + '</a>';
		}

		self.saveClick = function () {
			self.saveConceptSet("#txtConceptSetName");
		}

		self.routeTo = function (mode) {
			if (self.model.currentConceptSet() == undefined) {
				document.location = '#/conceptset/0/' + mode;
			} else {
				document.location = '#/conceptset/' + self.model.currentConceptSet().id + '/' + mode;
			}
		}

		self.closeConceptSet = function () {
			if (self.model.currentConceptSetDirtyFlag.isDirty() && !confirm("Your concept set changes are not saved. Would you like to continue?")) {
				return;
			} else {
				pageModel.clearConceptSet();
				document.location = "#/conceptsets";
			}
		};

		self.conceptSetNameChanged = self.model.currentConceptSet().name.subscribe(function (newValue) {
			if ($.trim(newValue) == self.defaultConceptSetName) {
				$("#txtConceptSetName").css({
					'background-color': '#FF0000'
				});
			} else {
				$("#txtConceptSetName").css({
					'background-color': ''
				});
			}
		});

		self.saveConceptSet = function (txtElem, conceptSet, selectedConcepts) {
            if (conceptSet === undefined) {
                conceptSet = {};
                if (self.model.currentConceptSet() == undefined) {
                    conceptSet.id = 0;
                    conceptSet.name = self.conceptSetName;
                } else {
                    conceptSet = self.model.currentConceptSet();
                }
            }
            if (selectedConcepts === undefined) {
                selectedConcepts = self.model.selectedConcepts();
            }
			var abortSave = false;

			// Do not allow someone to save a concept set with the default name of "New Concept Set
			if (conceptSet && conceptSet.name() == self.defaultConceptSetName) {
				self.raiseConceptSetNameProblem('Please provide a different name for your concept set', txtElem);
				return;
			}

			// Next check to see that a concept set with this name does not already exist
			// in the database. Also pass the conceptSetId so we can make sure that the
			// current concept set is excluded in this check.
			var conceptSetId = conceptSet.id;
			var urlEncoded = encodeURI(config.services[0].url + 'conceptset/' + conceptSetId + '/' + conceptSet.name() + "/exists");
			var existanceCheckPromise = $.ajax({
				url: urlEncoded,
				method: 'GET',
				contentType: 'application/json',
				success: function (results) {
					if (results.length > 0) {
						self.raiseConceptSetNameProblem('A concept set with this name already exists. Please choose a different name.', txtElem);
						abortSave = true;
					}
				},
				error: function () {
					alert('An error occurred while attempting to load the concept from your currently configured provider.  Please check the status of your selection from the configuration button in the top right corner.');
				}
			});

			$.when(existanceCheckPromise).done(function () {
				if (abortSave) {
					return;
				}

				var conceptSetItems = [];

				for (var i = 0; i < selectedConcepts.length; i++) {
					var item = selectedConcepts[i];
					conceptSetItems.push({
						conceptId: item.concept.CONCEPT_ID,
						isExcluded: +item.isExcluded(),
						includeDescendants: +item.includeDescendants(),
						includeMapped: +item.includeMapped()
					});
				}

				var json = ko.toJSON(conceptSet);

				$.ajax({
					method: 'POST',
					url: config.services[0].url + 'conceptset/',
					contentType: 'application/json',
					data: json,
					dataType: 'json',
					success: function (data) {

						$.ajax({
							method: 'POST',
							url: config.services[0].url + 'conceptset/' + data.id + '/items',
							data: JSON.stringify(conceptSetItems),
							dataType: 'json',
							contentType: 'application/json',
							success: function (itemSave) {
								$('#conceptSetSaveDialog').modal('hide');
								document.location = '#/conceptset/' + data.id + '/details';
								self.model.currentConceptSetDirtyFlag.reset();
							}
						});
					}
				});

			});
		}

		self.raiseConceptSetNameProblem = function (msg, elem) {
			self.model.currentConceptSet().name.valueHasMutated();
			alert(msg);
			$(elem).select().focus();
		}
        
        self.exportCSV = function() {
            window.open(config.services[0].url + 'conceptset/' + self.model.currentConceptSet().id + '/export');
        }
        
        self.copy = function() {
            console.log("copy concept set: " + self.model.currentConceptSet().name());
            self.conceptSetName("COPY OF: " + self.model.currentConceptSet().name());
        	self.model.currentConceptSet(undefined);
        	self.saveConceptSet("#txtConceptSetName");
        }
        
        self.optimize = function() {
            self.activeUtility("optimize");
            self.loading(true);
            self.optimalConceptSet(null);
            self.optimizerRemovedConceptSet(null);
            $('conceptset-manager #modalConceptSetOptimize').modal('show');
            
            var conceptSetItems = [];

            for (var i = 0; i < self.model.selectedConcepts().length; i++) {
                var item = self.model.selectedConcepts()[i];
                conceptSetItems.push({
                    concept: item.concept,
                    isExcluded: +item.isExcluded(),
                    includeDescendants: +item.includeDescendants(),
                    includeMapped: +item.includeMapped()
                });
            }

			conceptSetItems = {items: conceptSetItems}
            
            vocabularyAPI.optimizeConceptSet(conceptSetItems).then(function (optimizationResults) {
            	var optimizedConcepts = [];
				_.each(optimizationResults.optimizedConceptSet.items, (item) => {
					optimizedConcepts.push(item);
				});            	
            	var removedConcepts = [];
				_.each(optimizationResults.removedConceptSet.items, (item) => {
					removedConcepts.push(item);
				});            	
                self.optimalConceptSet(optimizedConcepts);
                self.optimizerRemovedConceptSet(removedConcepts);
                self.loading(false);
                self.activeUtility("");
            });
        }
        
        self.overwriteConceptSet = function() {
            console.log("overwriteConceptSet");
            var newConceptSet = [];
            _.each(self.optimalConceptSet(), (item) => {
            	var newItem;
            	newItem = {
            		concept: item.concept,
            		isExcluded: ko.observable(item.isExcluded),
					includeDescendants: ko.observable(item.includeDescendants),
					includeMapped: ko.observable(item.includeMapped),
            	}
            	newConceptSet.push(newItem);
            })
            self.model.selectedConcepts(newConceptSet);
            $('conceptset-manager #modalConceptSetOptimize').modal('hide');
        }
        
        self.copyOptimizedConceptSet = function() {
            console.log("copyOptimizedConceptSet");
            if (self.model.currentConceptSet() == undefined) {
				self.optimizerSavingNewName(self.conceptSetName());
			} else {
				self.optimizerSavingNewName(self.model.currentConceptSet().name() + " - OPTIMIZED");
			}
            self.optimizerSavingNew(true);
        }
        
        self.saveNewOptimizedConceptSet = function() {
            console.log('save new concept set');
            var conceptSet = {};
            conceptSet.id = 0;
            conceptSet.name = self.optimizerSavingNewName;
            var selectedConcepts = [];
            _.each(self.optimalConceptSet(), (item) => {
            	var newItem;
            	newItem = {
            		concept: item.concept,
            		isExcluded: ko.observable(item.isExcluded),
					includeDescendants: ko.observable(item.includeDescendants),
					includeMapped: ko.observable(item.includeMapped),
            	}
            	selectedConcepts.push(newItem);
            })
            self.saveConceptSet("#txtOptimizerSavingNewName", conceptSet, selectedConcepts);
            self.optimizerSavingNew(false);
        }
        
        self.cancelSaveNewOptimizedConceptSet = function() {
            console.log("cancel");
            self.optimizerSavingNew(false);
        }
        
        self.chooseCS1 = function () {
            $('conceptset-manager #modalCS').modal('show');
            self.targetId = self.compareCS1Id;
            self.targetCaption = self.compareCS1Caption;
            self.targetExpression = self.compareCS1ConceptSet;
        }

        self.clearCS1 = function () {
            self.compareCS1Id(0);
            self.compareCS1Caption(null);
            self.compareCS1ConceptSet.removeAll();
            self.compareResults(null);
        }

        self.chooseCS2 = function () {
            $('conceptset-manager #modalCS').modal('show');
            self.targetId = self.compareCS2Id;
            self.targetCaption = self.compareCS2Caption;
            self.targetExpression = self.compareCS2ConceptSet;
        }

        self.clearCS2 = function () {
            self.compareCS2Id(0);
            self.compareCS2Caption(null);
            self.compareCS2ConceptSet.removeAll();
            self.compareResults(null);
        }

        self.conceptsetSelected = function (d) {
            $('conceptset-manager #modalCS').modal('hide');
            vocabularyAPI.getConceptSetExpression(d.id).then(function (csExpression) {
                self.targetId(d.id);
                self.targetCaption(d.name);
                self.targetExpression(csExpression.items);
            });
        }
        
        self.compareConceptSets = function() {
            console.log("compare");
            var compareTargets = [{items: self.compareCS1ConceptSet()}, {items: self.compareCS2ConceptSet()}];
            vocabularyAPI.compareConceptSet(compareTargets).then(function (compareResults) {
                var conceptIds = $.map(compareResults, function (o, n) {
                    return o.conceptId;
                });                
                cdmResultsAPI.getConceptRecordCount(self.currentResultSource().sourceKey, conceptIds, compareResults).then(function (rowcounts) {
                    self.compareResults(null);
                    self.compareResults(compareResults);
                });
            });
        }
        
        self.showSaveNewModal = function() {
            $('conceptset-manager #modalSaveNew').modal('show');
        }
        
        self.compareCreateNewConceptSet = function() {
            var dtItems = $('#compareResults table').DataTable().data();
            var conceptSet = {};
            conceptSet.id = 0;
            conceptSet.name = self.compareNewConceptSetName;
            var selectedConcepts = [];
            _.each(dtItems, (item) => {
                var concept;
                concept = {
                    CONCEPT_CLASS_ID: item.conceptClassId,
                    CONCEPT_CODE: item.conceptCode,
                    CONCEPT_ID: item.conceptId,
                    CONCEPT_NAME: item.conceptName,
                    DOMAIN_ID: item.domainId,
                    INVALID_REASON: null,
                    INVALID_REASON_CAPTION: null,
                    STANDARD_CONCEPT: null,
                    STANDARD_CONCEPT_CAPTION: null,
                    VOCABULARY_ID: null,                    
                }
            	var newItem;
            	newItem = {
            		concept: concept,
            		isExcluded: ko.observable(false),
					includeDescendants: ko.observable(false),
					includeMapped: ko.observable(false),
            	}
            	selectedConcepts.push(newItem);
            })
            self.saveConceptSet("#txtNewConceptSetName", conceptSet, selectedConcepts);
            $('conceptset-manager #modalSaveNew').modal('hide');
        }
        
        self.toggleOnSelectAllCheckbox = function(selector, selectAllElement) {
        	$(document).on('init.dt', selector, function (e, settings) {       		
            	$(selectAllElement).addClass("selected");
        	});
        }
        self.toggleOffSelectAllCheckbox = function(selector, selectAllElement) {
        	$(document).on('init.dt', selector, function (e, settings) {       		
            	$(selectAllElement).removeClass("selected");
        	});
        }
        
        self.refreshRecordCounts = function(obj, event) {
			if (event.originalEvent) {                
                // User changed event
                console.log("Record count refresh");
                self.recordCountsRefreshing(true);
                $("#dtConeptManagerRC").toggleClass("fa-database").toggleClass("fa-circle-o-notch").toggleClass("fa-spin");
                $("#dtConeptManagerDRC").toggleClass("fa-database").toggleClass("fa-circle-o-notch").toggleClass("fa-spin");
                var compareResults = self.compareResults();
                var conceptIds = $.map(compareResults, function(o, n) { 
                    return o.conceptId; 
                });
                cdmResultsAPI.getConceptRecordCount(self.currentResultSource().sourceKey, conceptIds, compareResults).then(function (rowcounts) {
                    self.compareResults(compareResults);
                    console.log('record counts different?');
                    self.recordCountsRefreshing(false);
					$("#dtConeptManagerRC").toggleClass("fa-database").toggleClass("fa-circle-o-notch").toggleClass("fa-spin");
					$("#dtConeptManagerDRC").toggleClass("fa-database").toggleClass("fa-circle-o-notch").toggleClass("fa-spin");
                });
            }
        }        

        // Initialize the select all checkboxes
        var excludeCount = 0;
        var descendantCount = 0;
        var mappedCount = 0;
        _.each(self.model.selectedConcepts(), (conceptSetItem) => {
            if (conceptSetItem.isExcluded()) {
                excludeCount++;
            }
            if (conceptSetItem.includeDescendants()) {
                descendantCount++;
            }
            if (conceptSetItem.includeMapped()) {
                mappedCount++;
            }
        });        
        if (excludeCount == self.model.selectedConcepts().length) {
            self.toggleOnSelectAllCheckbox('.conceptSetTable', '#selectAllExclude');
        } else {
            self.toggleOffSelectAllCheckbox('.conceptSetTable', '#selectAllExclude');
        }
        if (descendantCount == self.model.selectedConcepts().length) {
            self.toggleOnSelectAllCheckbox('.conceptSetTable', '#selectAllDescendants');
        } else {
            self.toggleOffSelectAllCheckbox('.conceptSetTable', '#selectAllDescendants');
        }
        if (mappedCount == self.model.selectedConcepts().length) {            
            self.toggleOnSelectAllCheckbox('.conceptSetTable', '#selectAllMapped');
        } else {            
            self.toggleOffSelectAllCheckbox('.conceptSetTable', '#selectAllMapped');
        }
        // Create event handlers for all of the select all elements
        $(document).on('click', '#selectAllExclude', function() { 
        	var isExcluded = !($("#selectAllExclude").hasClass("selected"));
        	$("#selectAllExclude").toggleClass("selected");
        	_.each(self.model.selectedConcepts(), (conceptSetItem) => {
            	conceptSetItem.isExcluded(isExcluded);
            });
        	self.model.resolveConceptSetExpression();          
        });
        $(document).on('click', '#selectAllDescendants', function() { 
        	var includeDescendants = !($("#selectAllDescendants").hasClass("selected"));
        	$("#selectAllDescendants").toggleClass("selected");
            var currentConcepts = self.model.selectedConcepts();
        	_.each(currentConcepts, (conceptSetItem) => {
            	conceptSetItem.includeDescendants(includeDescendants);
            });
            self.model.selectedConcepts(currentConcepts);
        	self.model.resolveConceptSetExpression();          
        });
        $(document).on('click', '#selectAllMapped', function() { 
        	var includeMapped = !($("#selectAllMapped").hasClass("selected"));
        	$("#selectAllMapped").toggleClass("selected");
        	_.each(self.model.selectedConcepts(), (conceptSetItem) => {
            	conceptSetItem.includeMapped(includeMapped);
            });
        	self.model.resolveConceptSetExpression();          
        });
        
        
	}

	var component = {
		viewModel: conceptsetManager,
		template: view
	};

	ko.components.register('conceptset-manager', component);
	return component;
});