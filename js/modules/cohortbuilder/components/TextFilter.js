define(['knockout', 'text!./TextFilterTemplate.html'], function (ko, componentTemplate) {

	function TextFilterViewModel(params) {
		var self = this;
		self.Filter = params.Filter; // this will be a Text input type.
		
		self.operationOptions = [{
			id: 'startsWith',
			name: 'Starting With'
		}, {
			id: 'contains',
			name: 'Containing'
		}, {
			id: 'endsWith',
			name: 'Ending With'
		}, {
			id: '!startsWith',
			name: 'Not Starting With'
		}, {
			id: '!contains',
			name: 'Not Containing'
		}, {
			id: '!endsWith',
			name: 'Not Ending With'
		}];
	};

	// return compoonent definition
	return {
		viewModel: TextFilterViewModel,
		template: componentTemplate
	};

});