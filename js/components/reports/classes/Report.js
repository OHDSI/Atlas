define([
	'knockout',
	'components/reports/const',
	'services/http',
	'components/Component',
], function (
	ko,
	constants,
	httpService,
	Component
) {
	class Report extends Component {
		constructor(params) {
			super(params);
			this.isLoading = ko.observable(true);
			this.chartFormats = {};
			this.context = params.context;
			this.source = this.context.currentSource;
			this.title = ko.computed(() => {
				const title = this.context.currentReport() ?
					`${this.source() ? (this.source().sourceName) : ''} ${this.context.currentReport().name()}` + ko.i18n('dataSources.reports.titleTail', ' Report')() : '';
				return title;
			});
			this.sourceKey = ko.computed(() => this.source() ? this.source().sourceKey : null);
			this.path = this.context.currentReport().path;
			this.conceptId = null;
			this.subscriptions.push(this.sourceKey.subscribe(newSource => {
				if (!newSource) {
					this.context.currentReport(null);
				} else {
					this.loadData();
				}
			}));
		}

		getData() {

			const url = constants.apiPaths.report({
				sourceKey: this.source() ? this.source().sourceKey : this.context.routerParams.sourceKey,
				path: this.context.currentReport().path || this.context.routerParams.reportName,
				conceptId: this.conceptId,
			});
			this.context.loadingReport(true);
			this.isLoading(true);
			this.context.hasError(false);
			this.context.errorMessage(null);
			const response = httpService.doGet(url);
			response.catch((error) => {
					this.context.hasError(true);
					if (error.status === 403) {
						this.context.errorMessage(ko.i18n('dataSources.noPermission', 'You have no permissions to see this report'));
					}
					console.error(error);
				})
				.finally(() => {
					this.context.loadingReport(false);
					this.isLoading(false);
				});

			return response;
		}

		loadData() {
			this.getData().then(rawData => this.parseData(rawData)).catch(() => {
				// protection from uncaught exception
			});
		}
	}

	return Report;
});
