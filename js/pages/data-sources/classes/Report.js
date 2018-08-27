define([
	'knockout',
  'pages/data-sources/const',
  'services/http',
  'providers/Component',
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
      this.title = ko.computed(() => {
        const title = this.context.currentReport()
            ? `${this.context.currentReport().name} report ${this.context.currentSource() ? ('(' + this.context.currentSource().sourceKey + ')') : ''}`
            : '';
        return title;
      });
      this.sourceKey = ko.computed(() => this.context.currentSource() ? this.context.currentSource().sourceKey : null);
      this.path = this.context.currentReport().path;
      this.conceptId = null;

      this.sourceKeySubscription = this.sourceKey.subscribe(newSource => {
        if (!newSource) {
          this.context.currentReport(null);
        } else {
          this.loadData();
        }
      });
    }

    dispose () {
      this.sourceKeySubscription.dispose();
    }

    getData() {
      const url = constants.apiPaths.report({
        sourceKey: this.sourceKey(),
        path: this.path,
        conceptId: this.conceptId,
      });
      this.context.loadingReport(true);
      this.isLoading(true);
      const response = httpService.doGet(url);
      response.catch((error) => {
          this.context.hasError(true);
          console.error(error);
        })
        .finally(() => {
          this.context.loadingReport(false);
          this.isLoading(false);
        });

      return response;
    }

    loadData() {
      this.getData().then(rawData => this.parseData(rawData));
    }
  }

  return Report;
});
