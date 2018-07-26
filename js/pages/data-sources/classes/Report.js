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
      this.title = this.context.currentReport().name;
      this.sourceKey = this.context.currentSource().sourceKey;
      this.path = this.context.currentReport().path;
      this.conceptId = null;
    }

    getData() {
      const url = constants.apiPaths.report({
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

  return Report;
});
