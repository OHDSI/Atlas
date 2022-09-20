define([
	'knockout',
	'text!./sqlExportPanel.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'utils/HighLightUtils',
	'services/CohortDefinition',
	'atlas-state',
	'services/AuthAPI',
	'./sqlExportPanelConfig',
	'prism',
	'less!./sqlExportPanel.less',
], function (
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	highlightJS,
	cohortService,
	sharedState,
	authApi,
	defaultInputParamsValues
) {

	class SqlExportPanel extends AutoBind(Component) {

		constructor(params) {

			super(params);

			const { sql, templateSql, dialect, clipboardTarget } = params;
			this.dialect = dialect;
			this.loading = ko.observable();
			this.sqlText = ko.observable(highlightJS(sql,'sql'));
			this.templateSql = templateSql || ko.observable();
			this.templateSql() && this.translateSql();
			this.sqlParams = ko.computed(() => this.sqlParamsList(this.sqlText() || this.templateSql()));
			this.clipboardTarget = clipboardTarget;
			this.subscriptions = [];
			this.subscriptions.push(this.templateSql.subscribe(v => !!v && this.translateSql()));
			this.sourceSql = ko.observable(true);
			this.paramsTemplateSql = ko.observable(this.sqlText);
			this.currentResultSource = ko.observable();
			this.resultSources = ko.computed(() => {
				const resultSources = [];
				sharedState.sources().forEach((source) => {
					if (source.hasResults && authApi.isPermittedAccessSource(source.sourceKey)) {
						resultSources.push(source);
						if (source.resultsUrl === sharedState.resultsUrl()) {
							this.currentResultSource(source);
						}
					}
				})

				return resultSources;
			});
			this.inputParamsValues = ko.observable(this.defaultParamsValue(this.currentResultSource));
			this.subscriptions.push(this.sqlParams.subscribe(v => !!v && this.inputParamsValues(this.defaultParamsValue(this.currentResultSource))));
		}

		dispose() {
			this.subscriptions.forEach(s => s.dispose());
		}

		async translateSql() {
			if (this.dialect && this.dialect !== 'templateSql') {
				this.loading(true);
				try {
					const result = await cohortService.translateSql(this.templateSql(), this.dialect);
					this.sqlText(result.data && highlightJS(result.data.targetSQL, 'sql'));
				} finally {
					this.loading(false);
				}
			}
		}

		sqlParamsList(templateSql) {
			const regexp = /@[-\w]+/g;
			const params = templateSql.match(regexp);
			const paramsList = new Set(params);
			return [...paramsList];
		}

		onSwitch() {
			this.sourceSql(!this.sourceSql());
		}

		onChangeParamsValue() {
			let templateText = this.sqlText();
			for (const param in this.inputParamsValues()) {
				if (!!this.inputParamsValues()[param].length) {
					templateText = templateText.replaceAll(param, this.inputParamsValues()[param])
				}
			}
			this.paramsTemplateSql(templateText);
		}

		defaultParamsValue(source) {
			const daimons = source().daimons;
			const inputParams = {};
			this.sqlParams().forEach(param => {
				const defaultParam = daimons.find(daimon => daimon.daimonType === defaultInputParamsValues[param]);

				if (!!defaultParam) {
					inputParams[param] = defaultParam.tableQualifier;
				} else {
					inputParams[param] = "";
				}
			});
			return inputParams;
		}

		changeSource() {
			const inputParams = this.defaultParamsValue(this.currentResultSource);
			this.inputParamsValues(inputParams);
			this.onChangeParamsValue();
		}
	}


	commonUtils.build('sql-export-panel', SqlExportPanel, view);
});