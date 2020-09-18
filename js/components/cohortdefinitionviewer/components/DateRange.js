define(['knockout', 'services/MomentAPI', 'text!./DateRangeTemplate.html'], function (ko, momentAPI, componentTemplate) {

	function DateRangeViewModel(params) {
		var self = this;
		self.Range = params.Range; // this will be a NumericRange input type.
		
		self.operationOptions = [{
			id: 'lt',
			name: ko.i18n('components.dateRange.before', 'before'),
		}, {
			id: 'lte',
			name: ko.i18n('components.dateRange.onOrBefore', 'on or Before'),
		}, {
			id: 'eq',
			name: ko.i18n('components.dateRange.on', 'on'),
		}, {
			id: 'gt',
			name: ko.i18n('components.dateRange.after', 'after'),
		}, {
			id: 'gte',
			name: ko.i18n('components.dateRange.onOrAfter', 'on or after'),
		}, {
			id: 'bt',
			name: ko.i18n('components.dateRange.between', 'between'),
		}, {
			id: '!bt',
			name: ko.i18n('components.dateRange.notBetween', 'not between'),
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