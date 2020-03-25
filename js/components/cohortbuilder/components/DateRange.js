define(['knockout', 'text!./DateRangeTemplate.html'], function (ko, componentTemplate) {

	function DateRangeViewModel(params) {
		var self = this;
		self.Range = params.Range; // this will be a NumericRange input type.
		
		self.operationOptions = [{
			id: 'lt',
			name: ko.i18n('cc.viewEdit.design.subgroups.component.date-range.before', 'Before')
		}, {
			id: 'lte',
			name: ko.i18n('cc.viewEdit.design.subgroups.component.date-range.on-or-before', 'On or Before')
		}, {
			id: 'eq',
			name: ko.i18n('cc.viewEdit.design.subgroups.component.date-range.on', 'On')
		}, {
			id: 'gt',
			name: ko.i18n('cc.viewEdit.design.subgroups.component.date-range.after', 'After')
		}, {
			id: 'gte',
			name: ko.i18n('cc.viewEdit.design.subgroups.component.date-range.on-or-after', 'On or After')
		}, {
			id: 'bt',
			name: ko.i18n('cc.viewEdit.design.subgroups.component.date-range.between', 'Between')
		}, {
			id: '!bt',
			name: ko.i18n('cc.viewEdit.design.subgroups.component.date-range.not-between', 'Not Between')
		}];
	};

	// return compoonent definition
	return {
		viewModel: DateRangeViewModel,
		template: componentTemplate
	};

});