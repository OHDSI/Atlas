define([
	'text!./impala.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
], function (
	view,
	Component,
	AutoBind,
	commonUtils,
) {
	class IRexportimpalaTab extends AutoBind(Component) {
		constructor(params) {
      super(params);
      this.parent = params.parent;
    }
	}

	return commonUtils.build('ir-export-impala', IRexportimpalaTab, view);
});