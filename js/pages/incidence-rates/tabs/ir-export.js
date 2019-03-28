define([
	'text!./ir-export.html',
	'components/Component',
	'utils/AutoBind',
  'utils/CommonUtils',
  './export/bigquery',
  './export/impala',
  './export/msaps',
  './export/mssql',
  './export/netezza',
  './export/oracle',
  './export/postgresql',
  './export/redshift',
  './export/templateSql',
  'less!./ir-export.less'
], function (
	view,
	Component,
	AutoBind,
	commonUtils,
) {
	class IRexportTab extends AutoBind(Component) {
		constructor(params) {
      super(params);
      this.parent = params.parent;
      this.parent.showSql();
    }
	}

	return commonUtils.build('ir-export', IRexportTab, view);
});