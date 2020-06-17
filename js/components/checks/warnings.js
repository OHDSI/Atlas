define([
	'knockout',
	'text!./warnings.html',
	'./const',
	'./utils',
	'components/Component',
	'utils/CommonUtils',
	'./warnings-badge',
	'databindings',
	'faceted-datatable',
	'css!./style.css',
],
function (
	ko, 
	view, 
	consts, 
	utils,
	Component,
	commonUtils,
) {
	class WarningComponent extends Component{
		constructor(params) {
			super(params);

			const self = this;
			this.current = params.current;
			this.changeFlag = params.changeFlag || ko.observable();
			this.diagnoseCallback = params.onDiagnoseCallback || function() {};
			this.warningsTotal = params.warningsTotal || ko.observable();
			this.infoCount = params.infoCount || ko.observable();
			this.warningCount = params.warningCount || ko.observable();
			this.criticalCount = params.criticalCount || ko.observable();
			this.onFixCallback = params.onFixCallback || function() {};
			this.warnings = ko.observableArray();
			this.loading = ko.observable(false);
			this.isFixCalled = false;
			this.warningsColumns = [
				{ data: 'severity', title: 'Severity', width: '100px', render: utils.renderSeverity, },
				{ data: 'message', title: 'Message', width: '100%', render: utils.renderMessage, }
			];
			this.warningsOptions = {
				Facets: [{
					'caption': 'Severity',
					'binding': o => o.severity,
					defaultFacets: [
						'WARNING', 'CRITICAL'
					],
				}],
			};
			// Entities use different methods of initialization
			this.changeSubscription = this.changeFlag.subscribe(() => this.runDiagnostics());
			this.initSubscription = this.current.subscribe(() => this.runDiagnostics());
			this.runDiagnostics();
		}

		drawCallback(settings) {
				if (settings.aoData) {
					const api = this.api();
					const rows = this.api().rows({page: 'current'});
					const data = rows.data();
					rows.nodes().each((element, index) => {
						const rowData = data[index];
						const context = ko.contextFor(element);
						ko.cleanNode(element);
						ko.applyBindings(context, element);
					});
				}
			};
	
		stateSaveCallback(settings, data){
			if (!this.isFixCalled){
				this.state = data;
			}
		};

		stateLoadCallback(settings, callback) {
			return this.state;
		};

		fixWarning(value, parent, event){
			this.isFixCalled = true;
			event.preventDefault();
			this.onFixCallback(value);
			this.onDiagnose();
			this.isFixCalled = false;
		};

		showWarnings(result) {
			const count = (severity) => result.warnings.filter(w => w.severity === severity).length;
			this.warnings(result.warnings);
			this.infoCount(count(consts.WarningSeverity.INFO));
			this.warningCount(count(consts.WarningSeverity.WARNING));
			this.criticalCount(count(consts.WarningSeverity.CRITICAL));
			this.warningsTotal(result.warnings.length);
			this.loading(false);
		}

		handleError(error) {
			this.warningsTotal(0);
			this.warnings.removeAll();
			this.loading(false);
		}

		runDiagnostics() {
			this.loading(true);
			const promise = this.diagnoseCallback();
			if (promise) {
				promise.then((data) => this.showWarnings(data), (error) => this.handleError(error));
			}
		}

		onDiagnose() {
			this.runDiagnostics();
		}

		dispose() {
			this.changeSubscription.dispose();
			this.initSubscription.dispose();
		}
	}
		
	return commonUtils.build('warnings', WarningComponent, view);
});