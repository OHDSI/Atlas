define([
	'knockout',
	'text!./warnings.html',
	'./const',
	'./utils',
	'components/Component',
	'utils/CommonUtils',
	'utils/AutoBind',
	'./warnings-badge',
	'databindings',
	'faceted-datatable',
	'less!./warnings.less',
],
function (
	ko, 
	view, 
	consts, 
	utils,
	Component,
	commonUtils,
	AutoBind,
) {
	class WarningComponent extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.current = params.current;
			this.changeFlag = params.changeFlag || ko.observable();
			this.diagnoseCallback = params.onDiagnoseCallback || function() {};
			this.warningsTotal = params.warningsTotal || ko.observable();
			this.infoCount = params.infoCount || ko.observable();
			this.warningCount = params.warningCount || ko.observable();
			this.criticalCount = params.criticalCount || ko.observable();
			this.onFixCallback = params.onFixCallback || function() {};
			this.warnings = ko.observableArray();
			this.isInitialLoading = ko.observable(true);
			this.isDiagnosticsRunning = params.isDiagnosticsRunning || ko.observable(false);
			this.warningsColumns = [
				{ data: 'severity', title: ko.i18n('columns.severity', 'Severity'), width: '100px', render: utils.renderSeverity, },
				{ data: 'message', title: ko.i18n('columns.message', 'Message'), width: '100%', render: utils.renderMessage, }
			];
			this.warningsOptions = {
				Facets: [{
					'caption': ko.i18n('facets.caption.severity', 'Severity'),
					'binding': o => o.severity,
					defaultFacets: [
						consts.WARNING,
						consts.CRITICAL,
					],
				}],
			};
			this.tableOptions = params.tableOptions || commonUtils.getTableOptions('L');
			this.subscriptions = [
				// Entities use different methods of initialization
				this.changeFlag.subscribe(() => this.runDiagnostics()),
			];
			if (!params.checkChangesOnly) {
				// Entities use different methods of initialization
				if (ko.unwrap(params.checkOnInit)) {
					this.subscriptions.push(this.current.subscribe(() => this.runDiagnostics()));
				} else {
					this.runDiagnostics();
				}
			}
		}

		showWarnings(result) {
			const count = (severity) => result.warnings.filter(w => w.severity === severity).length;
			this.warnings(result.warnings);
			this.infoCount(count(consts.WarningSeverity.INFO));
			this.warningCount(count(consts.WarningSeverity.WARNING));
			this.criticalCount(count(consts.WarningSeverity.CRITICAL));
			this.warningsTotal(result.warnings.length);
		}

		removeWarnings() {
			this.warningsTotal(0);
			this.warnings.removeAll();
		}

		async runDiagnostics() {
			try {
				this.isDiagnosticsRunning(true);
				const data = await this.diagnoseCallback();
				data && this.showWarnings(data);
			} catch (err) {
				console.error(err);
				this.removeWarnings();
			} finally {
				setTimeout(() => {
					this.isDiagnosticsRunning(false);
					this.isInitialLoading() && this.isInitialLoading(false);
				}, 300); // To prevent badge loader blinking on fast requests

			}
		}
	}
		
	return commonUtils.build('warnings', WarningComponent, view);
});