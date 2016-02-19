define(['knockout', 'text!./panacea-study-def-manager.html', 'jquery', 'knockout-jqAutocomplete', 'jquery-ui'], function (ko, view, $, jqAuto) {
	function panaceaStudyDefManager(params) {
		var self = this;
		self.model = params.model;
		self.services = params.services;
		self.panaceaStudyId = ko.observable();
		self.show = ko.observable(false);
		self.loading = ko.observable(true);
		self.cohortDefinitions = ko.observableArray();
		self.conceptsets = ko.observableArray();
		self.showConceptSetImporter = ko.observable(false);
		self.currentConceptSet = ko.observable();
		self.currentConceptsExpression = ko.observable();
		
		$.ajax({
			url: self.services()[0].url + 'cohortdefinition',
			method: 'GET',
			success: function (d) {
				self.cohortDefinitions(d);
				
				if(self.panaceaStudyId()){
					self.loading(false);
				}
			}
		});
		
		$.ajax({
			url: self.services()[0].url + 'conceptset',
			method: 'GET',
			success: function (d) {
				self.conceptsets(d);
			}
		});
		
		self.panaceaStudyId.subscribe(function (d) {
			self.loading(true);
			
			if(self.panaceaStudyId() == 'undefined'){
				$.ajax({
					url: self.services()[0].url + 'panacea/getemptynewstudy',
					method: 'GET',
					success: function (d) {
						self.currentStudy = d;
						self.show(true);
						self.loading(false);
					}
				});
				
			}else{
				$.ajax({
					url: self.services()[0].url + 'panacea/' + self.panaceaStudyId(),
					method: 'GET',
					success: function (d) {
						self.currentStudy = d;
						self.currentConceptsExpression(d.concepSetDef);
						self.show(true);

						if(self.cohortDefinitions().length > 0){
							self.loading(false);
						}
					}
				});
			}
		});	
		
		self.currentConceptSet.subscribe(function(){
			if(typeof self.currentConceptSet() === 'object'){
				$.ajax({
					url: self.services()[0].url + 'conceptset/' + self.currentConceptSet().id  +'/expression',
					method: 'GET',
					success: function (d) {
						self.currentConceptsExpression(JSON.stringify(d));
					}
				});
			}
		});	
		
		if (self.model != null && self.model.hasOwnProperty('panaceaStudyId')){
			self.panaceaStudyId(params.model.panaceaStudyId);
		}
		
		self.saveStudy = function () {
			self.currentStudy.concepSetDef = self.currentConceptsExpression();
			
			$.ajax({
				method: 'POST',
				url: self.services()[0].url + 'panacea/savestudy',
				contentType: 'application/json',
				data: JSON.stringify(self.currentStudy),
				dataType: 'json',
				success: function (savedStudy) {
					document.location = "#/panacea";
				}
			});			
		}

		self.cancelStudy = function () {
			document.location = "#/panacea";
		}
		
		self.toggleShowConcetpSetImporter = function(){
			self.showConceptSetImporter(!self.showConceptSetImporter());
	    };	    
	}

	var component = {
			viewModel: panaceaStudyDefManager,
			template: view
		};

	ko.components.register('panacea-study-def-manager', component);
	return component;
});
