define(['knockout', 'text!./panacea.html'], function (ko, view) {
	function panacea(params) {
		var self = this;
		self.model = params.model;
		self.services = params.services;
		self.panaceaStudyId = ko.observable();
		self.panaceaStudyId.extend({ notify: 'always' });
		
		self.panaceaStudyId.subscribe(function(d) {
			document.location = "#/panaceadef/" + d;
		});	


	}

	var component = {
		viewModel: panacea,
		template: view
	};

	ko.components.register('panacea', component);
	return component;
});
