define([
	'text!./ir-utilities.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
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