define(['knockout', 'text!./NumericRangeTemplate.html', 'databindings/autoGrowInput'], function (ko, componentTemplate) {

    function NumericRangeViewModel(params) {
        var self = this;
        self.Range = params.Range; // this will be a NumericRange input type.

        self.operationOptions = [
            {
                id: 'lt',
                name: ko.i18n('cc.viewEdit.design.subgroups.component.numeric-range.less-then', 'Less Than')
            }, {
                id: 'lte',
				name: ko.i18n('cc.viewEdit.design.subgroups.component.numeric-range.less-or-equal', 'Less or Equal To')
            }, {
                id: 'eq',
				name: ko.i18n('cc.viewEdit.design.subgroups.component.numeric-range.equal', 'Equal To')
            }, {

                id: 'gt',
				name: ko.i18n('cc.viewEdit.design.subgroups.component.numeric-range.grate-then', 'Greater Than')
            }, {
                id: 'gte',
                name: ko.i18n('cc.viewEdit.design.subgroups.component.numeric-range.grate-or-equal', 'Greater or Equal To')
            }, {
                id: 'bt',
                name: ko.i18n('cc.viewEdit.design.subgroups.component.numeric-range.between', 'Greater or Equal To')

            }, {
                id: '!bt',
                name: ko.i18n('cc.viewEdit.design.subgroups.component.numeric-range.not-between', 'Not Between')
            }
        ];
    };

    // return compoonent definition
    return {
        viewModel: NumericRangeViewModel,
        template: componentTemplate
    };

});