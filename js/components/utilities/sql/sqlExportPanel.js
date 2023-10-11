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
			this.currentCohort = ko.pureComputed(() =>sharedState.CohortDefinition.current().id());
			this.dialect = dialect;
			this.loading = ko.observable();
			this.sqlText = ko.observable(highlightJS(sql,'sql'));
			this.templateSql = templateSql || ko.observable();
			this.templateSql() && this.translateSql();
			this.currentResultSource = ko.observable();
			this.currentResultSourceValue = ko.pureComputed(() => this.currentResultSource() && this.currentResultSource().sourceKey);
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
			this.sqlParamsList = ko.pureComputed(() => this.calculateSqlParamsList(this.sqlText() || this.templateSql()))
			this.sqlParams = ko.observable(this.defaultParamsValue(this.sqlParamsList()));
			this.clipboardTarget = clipboardTarget;
			this.sourceSql = ko.observable(false);
			this.paramsTemplateSql = ko.observable(this.sqlText);

			//subscriptions
			this.subscriptions = [];
			this.subscriptions.push(this.sourceSql.subscribe(v => this.onChangeParamsValue()));
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
					this.sqlParams(this.defaultParamsValue(this.sqlParamsList()));
				} finally {
					this.loading(false);
				}
			}
		}

		calculateSqlParamsList(templateSql) {
			if (!templateSql) { // on new cohort template sql does not exist yet
				return [];
			}

			const regexp = /@[-\w]+/g;
			const params = templateSql.match(regexp);
			const paramsList = new Set(params);

			return paramsList;
		}

		onChangeParamsValue() {
			let templateText = this.sqlText();
			this.sqlParams().forEach(currentParam => {
				if (!!currentParam.value.length) {
					templateText = templateText.replaceAll(currentParam.name, currentParam.value);
				}
			});
			this.paramsTemplateSql(templateText);
		}

		defaultParamsValue(paramsList) {
			const daimons = this.currentResultSource().daimons;
			const inputParams = [];
			paramsList.forEach(param => {
				const currentDaimon = daimons.find(daimon => daimon.daimonType === defaultInputParamsValues[param]);
				const defaultInput = {
					name: param,
					value: ''
				};
				if (!!currentDaimon) {
					defaultInput.value = currentDaimon.tableQualifier;
				} else if (param === '@target_cohort_id'){
					defaultInput.value = `${this.currentCohort()}`;
				} else {
					defaultInput.value = "";
				}
				inputParams.push(defaultInput);
			});
			return inputParams;
		}

		onSourceChange(obj, event) {
			this.currentResultSource(this.resultSources().find(source => source.sourceKey === event.target.value));
			this.sqlParams(this.defaultParamsValue(this.sqlParamsList()));
			this.onChangeParamsValue();
		}
	}


	commonUtils.build('sql-export-panel', SqlExportPanel, view);
});