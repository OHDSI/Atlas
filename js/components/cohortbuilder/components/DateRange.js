define(['knockout', 'text!./DateRangeTemplate.html'], function (ko, componentTemplate) {

	function DateRangeViewModel(params) {
		var self = this;
		self.Range = params.Range; // this will be a NumericRange input type.
		
		self.operationOptions = [{
			id: 'lt',
			name: 'Before'
		}, {
			id: 'lte',
			name: 'On or Before'
		}, {
			id: 'eq',
			name: 'On'
		}, {
			id: 'gt',
			name: 'After'
		}, {
			id: 'gte',
			name: 'On or After'
		}, {
			id: 'bt',
			name: 'Between'
		}, {
			id: '!bt',
			name: 'Not Between'
		}];
	};

	// return compoonent definition
	return {
		viewModel: DateRangeViewModel,
		template: componentTemplate
	};

});