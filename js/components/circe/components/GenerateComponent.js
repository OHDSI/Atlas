define(['knockout','text!./GenerateComponentTemplate.html'], function (ko, template) {

	function GenerateComponentViewModel(params) {
		var self = this;
		self.info = params.info;
		self.dirtyFlag = params.dirtyFlag;
		self.source = params.source;
		self.isRunning = ko.pureComputed(function () {
			return (self.info() && self.info().status != "COMPLETE");
		});
	}
	
	// return compoonent definition
	return {
		viewModel: GenerateComponentViewModel,
		template: template
	};
});