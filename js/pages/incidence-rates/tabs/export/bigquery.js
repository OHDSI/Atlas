define([
	'text!./bigquery.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
], function (
	view,
	Component,
	AutoBind,
	commonUtils,
) {
	class IRexportbigqueryTab extends AutoBind(Component) {
		constructor(params) {
      super(params);
      this.parent = params.parent;
    }
	}

	return commonUtils.build('ir-export-bigquery', IRexportbigqueryTab, view);
});