define(['knockout', 'text!./configuration.html'], function (ko, view) {
	function configuration(params) {
		var self = this;
		self.enableRecordCounts = params.enableRecordCounts;
		self.services = params.services();
	}

	var component = {
		viewModel: configuration,
		template: view
	};

	ko.components.register('ohdsi-configuration', component);
	return component;
});
