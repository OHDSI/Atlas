define(['knockout','components/cohortbuilder/options', 'text!./WindowInputTemplate.html'], function (ko, options, template) {

	function WindowInputViewModel(params) {
		var self = this;
		self.options = options;
		self.Window = ko.utils.unwrapObservable(params.Window); // this will be a Window input type.
		
		self.getCoeffName = function(coeffId) {
			return self.options.windowCoeffOptions.filter(function(item) {
				return item.value == coeffId;
			})[0].name;
		};
		
	}
	
	// return compoonent definition
	return {
		viewModel: WindowInputViewModel,
		template: template
	};

});