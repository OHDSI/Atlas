define(['knockout', 'text!./panacea-study-def-manager.html'], function (ko, view) {
	function panaceaStudyDefManager(params) {
		var self = this;
		self.model = params.model;
		self.services = params.services;
		self.panaceaStudyId = ko.observable();
		self.show = ko.observable(false);
		self.loading = ko.observable(true);
		self.cohortDefinitions = ko.observableArray(); 
		
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
						self.show(true);

						if(self.cohortDefinitions().length > 0){
							self.loading(false);
						}
					}
				});
			}
		});		
		
		if (self.model != null && self.model.hasOwnProperty('panaceaStudyId')){
			self.panaceaStudyId(params.model.panaceaStudyId);
		}
		
		self.saveStudy = function () {
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
	}

	var component = {
			viewModel: panaceaStudyDefManager,
			template: view
		};

	ko.components.register('panacea-study-def-manager', component);
	return component;
});
