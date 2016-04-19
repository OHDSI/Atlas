define(['knockout', 'text!./panacea-study-def-manager.html', 'jquery', 'knockout-jqAutocomplete', 'appConfig', 'jquery-ui'], function (ko, view, $, jqAuto, config) {
	function panaceaStudyDefManager(params) {
		var self = this;
		self.model = params.model;
		self.services = params.services;
		self.sources = config.services[0].sources;
		self.currentRunSource = ko.observable(self.sources[0]);
		self.panaceaStudyId = ko.observable();
		self.currentStudy = ko.observable();
		self.show = ko.observable(false);
		self.loading = ko.observable(true);
		self.cohortDefinitions = ko.observableArray();
		self.currentCohort = ko.observable().extend({ panaceaRequired: "Please pick a cohort"});
		self.conceptsets = ko.observableArray();
		self.showConceptSetImporter = ko.observable(false);
		self.currentConceptSet = ko.observable();
		self.currentConceptsExpression = ko.observable();
		self.studyName = ko.observable().extend({ panaceaRequired: "Please enter a study name"});
		self.studyDesc = ko.observable();
//		self.studyDuration = ko.observable().extend({ panaceaRequired: "Please enter study duration", panaceaInteger: "Please enter an integer number"});
		self.studyDuration = ko.observable().extend({ panaceaRequired: "Please enter study duration"});
		self.switchWindow = ko.observable().extend({ panaceaRequired: "Please enter switch window"});
		self.startDate = ko.observable();
		self.endDate = ko.observable();
		self.selectedConcepts = ko.observableArray();
		self.minUnitDays = ko.observable();
		self.minUnitCounts = ko.observable();
		self.gapThreshold = ko.observable();
		self.isAllValid =  ko.computed(function() {
	        if(self.studyName() && self.currentCohort() && self.studyDuration() && self.switchWindow()){
	        	return true;
	        }
	        else{
	        	return false;
	        }
	    }, this);
		
		self.currentStudy.subscribe(function (d) {
			$.ajax({
				url: config.services[0].url + 'cohortdefinition',
				method: 'GET',
				success: function (d) {
					jQuery.each(d, function( i, val ) {
						val.showLabel = val.id + ' - ' + val.name;
					});
					
					self.cohortDefinitions(d);
					
					if(self.panaceaStudyId() && self.panaceaStudyId() != 'undefined'){
						var cohortById = $.grep(self.cohortDefinitions(), function(item){
							return item.id === self.currentStudy().cohortDefId; 
						});
						if (cohortById.length > 0) {
							self.currentCohort(cohortById[0]);
						}
					}
					
					if(self.cohortDefinitions().length > 0 && self.conceptsets().length > 0){
						self.loading(false);
					}
				}
			});
			
			$.ajax({
				url: config.services[0].url + 'conceptset',
				method: 'GET',
				success: function (d) {
					self.conceptsets(d);
					
					if(self.panaceaStudyId() && self.panaceaStudyId() != 'undefined'){
						var conceptSetById = $.grep(self.conceptsets(), function(item){
							return item.id === self.currentStudy().conceptSetId; 
						});
						if (conceptSetById.length > 0) {
							self.currentConceptSet(conceptSetById[0]);
						}
					}
					
					if(self.cohortDefinitions().length > 0 && self.conceptsets().length > 0){
						self.loading(false);
					}						
				}
			});
		});	
		
		self.panaceaStudyId.subscribe(function (d) {
			self.loading(true);
			
			if(self.panaceaStudyId() == 'undefined'){
				$.ajax({
					url: config.services[0].url + 'panacea/getemptynewstudy',
					method: 'GET',
					success: function (d) {
						self.currentStudy(d);
						self.show(true);
					}
				});
				
			}else{
				$.ajax({
					url: config.services[0].url + 'panacea/' + self.panaceaStudyId(),
					method: 'GET',
					success: function (d) {
						self.currentStudy(d);
						self.studyName(d.studyName);
						self.studyDesc(d.studyDesc);
						self.studyDuration(d.studyDuration);
						self.switchWindow(d.switchWindow);
						self.currentConceptsExpression(d.concepSetDef);
						if(d.startDate){
							self.startDate(new Date(d.startDate).toISOString().split('T')[0]);
						}else{
							self.startDate(null);
						}
						if(d.endDate){
							self.endDate(new Date(d.endDate).toISOString().split('T')[0]);
						}else{
							self.endDate(null);
						}
						self.minUnitDays(d.minUnitDays);
						self.minUnitCounts(d.minUnitCounts);
						if(d.gapThreshold != null){
							self.gapThreshold(100 - d.gapThreshold);
						}
						self.show(true);
					}
				});
			}
		});	
		
		self.currentConceptSet.subscribe(function(){
			if(typeof self.currentConceptSet() === 'object'){
				$.ajax({
					url: config.services[0].url + 'conceptset/' + self.currentConceptSet().id  +'/expression',
					method: 'GET',
					success: function (d) {
						self.currentConceptsExpression(JSON.stringify(d));
						
						self.selectedConcepts.removeAll();
						for (var i = 0; i < d.items.length; i++) {
							var conceptSetItem = {};

							conceptSetItem.concept = d.items[i].concept;
							conceptSetItem.isExcluded = ko.observable(d.items[i].isExcluded);
							conceptSetItem.includeDescendants = ko.observable(d.items[i].includeDescendants);
							conceptSetItem.includeMapped = ko.observable(d.items[i].includeMapped);

							
//							selectedConceptsIndex[d[i].concept.CONCEPT_ID] = 1;
							self.selectedConcepts.push(conceptSetItem);
						}
					}
				});
			}
		});	
		
		if (self.model != null && self.model.hasOwnProperty('panaceaStudyId')){
			self.panaceaStudyId(params.model.panaceaStudyId);
		}
		
		self.saveStudy = function () {
			self.currentStudy().concepSetDef = self.currentConceptsExpression();
			self.currentStudy().cohortDefId = self.currentCohort().id;
			self.currentStudy().studyName = self.studyName();
			self.currentStudy().studyDesc = self.studyDesc();
			self.currentStudy().studyDuration = self.studyDuration();
			self.currentStudy().switchWindow = self.switchWindow();
			self.currentStudy().conceptSetId = self.currentConceptSet().id;
			self.currentStudy().minUnitDays = self.minUnitDays();
			self.currentStudy().minUnitCounts = self.minUnitCounts();
			if(self.gapThreshold() != null){
				self.currentStudy().gapThreshold = 100 - self.gapThreshold();
			}
	
			var unwrappedStart = ko.utils.unwrapObservable(self.startDate());
		    if(unwrappedStart === undefined || unwrappedStart === null) {
		    	self.currentStudy().startDate = null;
		    } else {
		    	self.currentStudy().startDate = unwrappedStart;
		    }
			
			var unwrappedEnd = ko.utils.unwrapObservable(self.endDate());
		    if(unwrappedEnd === undefined || unwrappedEnd === null) {
		    	self.currentStudy().endDate = null;
		    } else {
		    	self.currentStudy().endDate = unwrappedEnd;
		    }
			
			$.ajax({
				method: 'POST',
				url: config.services[0].url + 'panacea/savestudy',
				contentType: 'application/json',
				data: JSON.stringify(self.currentStudy()),
				dataType: 'json',
				success: function (savedStudy) {
					document.location = "#/panacea";
				}
			});			
		}

		self.cancelStudy = function () {
			document.location = "#/panacea";
		}
		
		self.runStudy = function() {
			$.ajax({
				url: config.services[0].url + 'panacea/runPncTasklet/' + self.currentRunSource().sourceKey + '/' + self.panaceaStudyId(),
				method: 'GET',
				success: function () {
					document.location = "#/panacea";
				}
			});
		}
		
		self.runGenerateStudySum = function() {
			$.ajax({
				url: config.services[0].url + 'panacea/runPncFilterSummaryTasklet/' + self.currentRunSource().sourceKey + '/' + self.panaceaStudyId(),
				method: 'GET',
				success: function () {
					document.location = "#/panacea";
				}
			});
		}
		
		self.toggleShowConcetpSetImporter = function(){
			self.showConceptSetImporter(!self.showConceptSetImporter());
	    };
	}
	
	self.renderConceptSetCheckBox = function(field){
		return '<span data-bind="css: { selected: ' + field + '} " class="fa fa-check"></span>';
	}

	ko.extenders.panaceaRequired = function(target, overrideMessage) {
	    //add some sub-observables to our observable
	    target.hasError = ko.observable();
	    target.validationMessage = ko.observable();
	 
	    //define a function to do validation
	    function validate(newValue) {
	       target.hasError(newValue ? false : true);
	       target.validationMessage(newValue ? "" : overrideMessage || "This field is required");
	    }
	 
	    //initial validation
	    validate(target());
	 
	    //validate whenever the value changes
	    target.subscribe(validate);
	 
	    //return the original observable
	    return target;
	};
	 
	ko.extenders.panaceaInteger = function(target) {
	    //create a writable computed observable to intercept writes to our observable
	    var result = ko.pureComputed({
	        read: target,  //always return the original observables value
	        write: function(newValue) {
	            var current = target(),
	                roundingMultiplier = Math.pow(10, 0),
	                newValueAsNum = isNaN(newValue) ? 0 : parseFloat(+newValue),
	                valueToWrite = Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;
	 
	            //only write if it changed
	            if (valueToWrite !== current) {
	                target(valueToWrite);
	            } else {
	                //if the rounded value is the same, but a different value was written, force a notification for the current field
	                if (newValue !== current) {
	                    target.notifySubscribers(valueToWrite);
	                }
	            }
	        }
	    }).extend({ notify: 'always' });
	 
	    //initialize with current value to make sure it is rounded appropriately
	    result(target());
	 
	    //return the new computed observable
	    return result;
	};
	
	var component = {
			viewModel: panaceaStudyDefManager,
			template: view
		};

	ko.components.register('panacea-study-def-manager', component);
	return component;
});
