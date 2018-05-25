define([
	'knockout',
  'pages/data-sources/const',
  'services/http',
  'providers/Component',
], function (
	ko,
  helpers,
  httpService,
  Component
) {
  class AbstractReport extends Component {
    constructor() {
      super();
      this.isLoading = ko.observable(true);
      this.chartFormats = {};
    }

    render(params) {
      const {
        context,
      } = params;
      this.context = context;
      this.name = this.context.currentReport().name;
      this.sourceKey = this.context.currentSource().sourceKey;
      this.path = this.context.currentReport().path;
      this.conceptId = null;
    }

    getData() {
      const url = helpers.apiPaths.report({
        sourceKey: this.sourceKey,
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
  }

  return AbstractReport;
});
