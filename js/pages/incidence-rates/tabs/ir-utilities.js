define([
	'text!./ir-utilities.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'utilities/import',
	'utilities/export',
], function (
	view,
	Component,
	AutoBind,
	commonUtils,
) {
	class IRutilitiesTab extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.parent = params.parent;
		}
	}

	return commonUtils.build('ir-utilities', IRutilitiesTab, view);
});