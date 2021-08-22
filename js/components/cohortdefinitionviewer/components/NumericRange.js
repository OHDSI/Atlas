define(['knockout', 'text!./NumericRangeTemplate.html'], function (ko, componentTemplate) {

	function NumericRangeViewModel(params) {
		var self = this;
		self.Range = params.Range; // this will be a NumericRange input type.
		
		self.operationOptions = [{
			id: 'lt',
			name: '<'
		}, {
			id: 'lte',
			name: '<='
		}, {
			id: 'eq',
			name: '='
		}, {
			id: 'gt',
			name: '>'
		}, {
			id: 'gte',
			name: '>='
		}, {
			id: 'bt',
			name: ko.i18n('options.between', 'between')
		}, {
			id: '!bt',
			name: ko.i18n('options.notBetween', 'not between')
		}];

		self.rangeOpName = ko.pureComputed(function() {
			return ko.utils.unwrapObservable(self.Range) && self.operationOptions.filter(function(item) {
				return item.id == ko.utils.unwrapObservable(ko.utils.unwrapObservable(self.Range).Op);
			})[0].name;
		});

	};

	// return compoonent definition
	return {
		viewModel: NumericRangeViewModel,
		template: componentTemplate
	};

});