define(['knockout', 'text!./studyreport-manager.html'], function (ko, view) {
	function studyreportManager(params) {
		var self = this;
		self.sections = params.sections;
	}

	var component = {
		viewModel: studyreportManager,
		template: view
	};

	ko.components.register('studyreport-manager', component);
	return component;
});
