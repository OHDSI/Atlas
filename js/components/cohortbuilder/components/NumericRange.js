define(['knockout', 'text!./NumericRangeTemplate.html', 'databindings/autoGrowInput'], function (ko, componentTemplate) {

	function NumericRangeViewModel(params) {
		var self = this;
		self.Range = params.Range; // this will be a NumericRange input type.
		
		self.operationOptions = [{
			id: 'lt',
			name: 'Less Than'
		}, {
			id: 'lte',
			name: 'Less or Equal To'
		}, {
			id: 'eq',
			name: 'Equal To'
		}, {
			id: 'gt',
			name: 'Greater Than'
		}, {
			id: 'gte',
			name: 'Greater or Equal To'
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
		viewModel: NumericRangeViewModel,
		template: componentTemplate
	};

});