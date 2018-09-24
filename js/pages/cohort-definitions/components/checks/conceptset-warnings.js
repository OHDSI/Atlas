define(['knockout', 'text!./conceptset-warnings.html',
    'services/CohortDefinitionService',
    './const',
    './utils',
    'databindings',
    'faceted-datatable',
    'css!./style.css',
  ],
  function (ko, view, cohortDefinitionService, consts, utils) {

    function conceptSetWarnings(params){
      var self = this;
      self.model = params.model;
      self.cohortDefinitionId = self.model.currentCohortDefinition().id || ko.observable(-1);
      self.count = params.count || ko.observable();
      self.infoCount = params.infoCount || ko.observable();
      self.warningCount = params.warningCount || ko.observable();
      self.criticalCount = params.criticalCount || ko.observable();
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
      	const count = (severity) => result.warnings.filter(w => w.severity === severity).length;
        self.warnings(result.warnings);
        self.infoCount(count(consts.WarningSeverity.INFO));
        self.warningCount(count(consts.WarningSeverity.WARNING));
        self.criticalCount(count(consts.WarningSeverity.CRITICAL));
        self.count(result.warnings.length);
        self.loading(false);
      }

      function handleError() {
        self.count(0);
        self.warnings.removeAll();
        self.loading(false);
      }

      self.runDiagnostics = async (id, expression) => {
        self.loading(true);
        try {
          const result = await cohortDefinitionService.runDiagnostics(id, expression);
          showWarnings(result);
        } catch(er) {
          console.error('Error when running diagnostics', er);          
          handleError();
        }
      };

      self.getWarnings = async () => {
        if (parseInt(self.cohortDefinitionId(), 10) <= 0 || isNaN(self.cohortDefinitionId())) {
          return false;
        }
        self.loading(true);
        try {
          const warnings = await cohortDefinitionService.getWarnings(self.cohortDefinitionId());
          showWarnings(warnings);
        } catch(er) {
          console.error('Error when getting warnings', er);          
          handleError();
        }
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