define([
	'text!./component-sql-export.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'./export-sql',
	'css!./component-sql-export.css'
], function (
	view,
	Component,
	AutoBind,
	commonUtils,
) {
	class ComponentSQLExportTab extends AutoBind(Component) {
		constructor(params) {
      super(params);
      this.parent = params.parent;
      this.parent.showSql();
    }
	}

	return commonUtils.build('component-sql-export', ComponentSQLExportTab, view);
});