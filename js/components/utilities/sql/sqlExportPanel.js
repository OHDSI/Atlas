define([
	'knockout',
	'text!./sqlExportPanel.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'services/CohortDefinition',
], function (
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	cohortService,
) {

	class SqlExportPanel extends AutoBind(Component) {

		constructor(params) {

			super(params);

			const { sql, templateSql, dialect, clipboardTarget } = params;
			this.dialect = dialect;
			this.loading = ko.observable();
			this.sqlText = sql || ko.observable();
			this.templateSql = templateSql || ko.observable();
			this.templateSql() && this.translateSql();
			this.clipboardTarget = clipboardTarget;
			this.subscriptions = [];
			this.subscriptions.push(this.templateSql.subscribe(v => !!v && this.translateSql()));
		}

		dispose() {
			this.subscriptions.forEach(s => s.dispose());
		}

		async translateSql() {
			if (this.dialect && this.dialect !== 'templateSql') {
				this.loading(true);
				try {
					const result = await cohortService.translateSql(this.templateSql(), this.dialect);
					this.sqlText(result.data && result.data.targetSQL);
				} finally {
					this.loading(false);
				}
			}
		}
	}


	commonUtils.build('sql-export-panel', SqlExportPanel, view);
});