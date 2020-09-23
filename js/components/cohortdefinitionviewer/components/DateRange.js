define(['knockout', 'services/MomentAPI', 'text!./DateRangeTemplate.html'], function (ko, momentAPI, componentTemplate) {

	function DateRangeViewModel(params) {
		var self = this;
		self.Range = params.Range; // this will be a NumericRange input type.
		
		self.operationOptions = [{
			id: 'lt',
			name: 'before'
		}, {
			id: 'lte',
			name: 'on or Before'
		}, {
			id: 'eq',
			name: 'on'
		}, {
			id: 'gt',
			name: 'after'
		}, {
			id: 'gte',
			name: 'on or after'
		}, {
			id: 'bt',
			name: 'between'
		}, {
			id: '!bt',
			name: 'not between'
		}];
		self.rangeOpName = ko.pureComputed(function() {
			if (!!ko.utils.unwrapObservable(self.Range)) {
				return self.operationOptions.filter(function(item) {
					return item.id == ko.utils.unwrapObservable(ko.utils.unwrapObservable(self.Range).Op);
				})[0].name;
			}
		});
		self.prettyValue = ko.pureComputed(() => momentAPI.formatDateToString((ko.toJS(self.Range) || {}).Value) || '');
		self.prettyExtent = ko.pureComputed(() => momentAPI.formatDateToString((ko.toJS(self.Range) || {}).Extent) || '');
	};

	// return compoonent definition
	return {
		viewModel: DateRangeViewModel,
		template: componentTemplate
	};

});