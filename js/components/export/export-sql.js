define([
	'text!./export-sql.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
], function (
	view,
	Component,
	AutoBind,
	commonUtils,
) {
	class SQLExportTab extends AutoBind(Component) {
		constructor(params) {
      super(params);
      this.parent = params.parent;
	  this.dialect = params.dialect;
    }
	}

	return commonUtils.build('export-sql', SQLExportTab, view);
});