define([
	'knockout',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'text!./nav-pills.html',	
	'less!./nav-pills.less',
], function (
	ko,
	Component,
	AutoBind,
	commonUtils,
	view
) {
	class NavPills extends AutoBind(Component) {
		constructor(params) {
			super();
			this.selected = params.selected;
			this.pills = params.pills;
		}
		
		onSelect(pill, event) {
			this.selected(pill.key);			
		}
	}
	
	return commonUtils.build('nav-pills', NavPills, view);
});