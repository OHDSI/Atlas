define(['knockout', 'text!./panacea-study-def-manager.html'], function (ko, view) {
	function panaceaStudyDefManager(params) {
		var self = this;
		self.model = params.model;
		self.services = params.services;
		self.panaceaStudyId = ko.observable();
		self.show = ko.observable(false);
		
		self.panaceaStudyId.subscribe(function (d) {
			$.ajax({
				url: self.services()[0].url + 'panacea/' + self.panaceaStudyId(),
				method: 'GET',
				success: function (d) {
					self.currentStudy = d;
					self.show(true);
				}
			});
		});		
		
		if (self.model != null && self.model.hasOwnProperty('panaceaStudyId')){
			self.panaceaStudyId(params.model.panaceaStudyId);
		}
		
		self.saveStudy = function () {
			document.location = "#/panacea";
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
