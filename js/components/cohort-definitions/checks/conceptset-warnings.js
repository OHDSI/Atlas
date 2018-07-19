define(['knockout', 'text!components/cohort-definitions/checks/conceptset-warnings.html',
    'webapi/CohortDefinitionAPI',
    './const',
    './utils',
    'databindings',
    'faceted-datatable',
    'css!./style.css',
  ],
  function (ko, view, cohortDefinitionApi, consts, utils) {

    function conceptSetWarnings(params){
      var self = this;
      self.model = params.model;
      self.cohortDefinitionId = self.model.currentCohortDefinition().id || ko.observable(-1);
      self.count = params.count || ko.observable();
      self.infoCount = params.infoCount || ko.observable();
      self.onFixCallback = params.onFixCallback || function() {};
      self.canDiagnose = params.canDiagnose || ko.observable(false);
      self.warnings = ko.observableArray();
      self.loading = ko.observable(false);
      self.warningsColumns = [
        { data: 'severity', title: 'Severity', width: '100px', render: utils.renderSeverity, },
        { data: 'message', title: 'Message', width: '100%', render: utils.renderMessage, }
      ];
      self.warningsOptions = {
        Facets: [{
          'caption': 'Severity',
          'binding': o => o.severity,
          defaultFacets: [
            'WARNING', 'CRITICAL'
          ],
        }],
      };

      self.drawCallback = function(settings) {
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

      self.fixRedundantConceptSet = function(value, parent, event){
        event.preventDefault();
        self.onFixCallback(value);
        self.onDiagnose();
      };

      function showWarnings(result){
        self.warnings(result.warnings);
        self.infoCount(result.warnings.filter(w => w.severity === consts.WarningSeverity.INFO).length);
        self.count(result.warnings.length);
        self.loading(false);
      }

      function handleError() {
        self.count(0);
        self.warnings.removeAll();
        self.loading(false);
      }

      self.runDiagnostics = function(id, expression){
        self.loading(true);
        cohortDefinitionApi.runDiagnostics(id, expression)
          .then(showWarnings, handleError);
      };

      self.getWarnings = function() {
        self.loading(true);
        cohortDefinitionApi.getWarnings(self.cohortDefinitionId())
          .then(showWarnings, handleError);
      };

      self.onDiagnose = function(){
        var expressionJSON = ko.toJSON(self.model.currentCohortDefinition().expression(), function(key, value){
          return (value === 0 || value) ?  value : undefined;
        }, 2);
        self.runDiagnostics(self.cohortDefinitionId(), expressionJSON);
      };

      self.model.currentCohortDefinition.subscribe(() => self.getWarnings());

      self.getWarnings();
    }

    var component = {
      viewModel: conceptSetWarnings,
      template: view,
    };

    ko.components.register('conceptset-warnings', component);
    return component;
  }
);