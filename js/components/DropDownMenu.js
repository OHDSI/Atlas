define([
	'knockout',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'text!./DropDownMenu.html',
], function(
	ko,
	Component,
	AutoBind,
	commonUtils,
	view,
){

	class DropDownMenu extends AutoBind(Component) {

		constructor(params) {
			super(params);
			this.title = params.title  || ko.i18n('common.menu', 'Menu');
			this.actions = params.actions || [];
			this.formatOption = params.formatOption || function(d){ return d};
			this.dropDownClasses = params.cssClasses || 'btn-group pull-right';
			this.buttonClasses = params.buttonClasses || 'btn btn-primary btn-sm dropdown-toggle';
			this.icon = params.icon || '<i class="fa fa-plus"></i>';
		}
	}

	commonUtils.build('drop-down-menu', DropDownMenu, view);

});