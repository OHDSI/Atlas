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
    }

    render(params) {
      const {
        context,
      } = params;
      this.context = context;
      this.sourceKey = this.context.currentSource().sourceKey;
      this.name = this.context.currentReport().name;
      this.path = this.context.currentReport().path;
    }

    getData() {
      const url = helpers.apiPaths.report({
        sourceKey: this.sourceKey,
        path: this.path,
      });
      this.isLoading(true);
      const response = httpService.doGet(url);
      response.catch((error) => {
          this.context.hasError(true);
          console.log(error);
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
