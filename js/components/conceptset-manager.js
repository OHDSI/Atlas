define(['knockout', 
        'text!./conceptset-manager.html', 
        'appConfig', 
        'ohdsi.util', 
        'vocabularyprovider',
        'knockout.dataTables.binding', 
        'bootstrap',
        'faceted-datatable', 
        'databindings', 
        'negative-controls'
], function (ko, view, config, ohdsiUtil, vocabularyAPI) {
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
	}

	var component = {
		viewModel: conceptsetManager,
		template: view
	};

	ko.components.register('conceptset-manager', component);
	return component;
});