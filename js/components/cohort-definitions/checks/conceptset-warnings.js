define(['knockout', 'text!components/cohort-definitions/checks/conceptset-warnings.html',
    'webapi/CohortDefinitionAPI',
    './const',
    'css!./style.css'
  ],
  function (ko, view, cohortDefinitionApi, consts) {

    function conceptSetWarnings(params){
      var self = this;
      self.model = params.model;
      self.cohortDefinitionId = self.model.currentCohortDefinition().id || ko.observable(-1);
      self.count = params.count || ko.observable();
      self.onFixCallback = params.onFixCallback || function() {};
      self.canDiagnose = params.canDiagnose || ko.observable(false);
      self.warnings = ko.observableArray();
      self.loading = ko.observable(false);

      self.renderSeverity = function(value){
        var icon = consts.WarningSeverity[value];
        return icon ? '<i class="fa ' + icon + '"></i>' : "";
      };

      self.renderMessage = function(value, c, data) {
        if (data.type === 'ConceptSetWarning' && data.conceptSetId) {
          return '<span class="warning-message">' + value +
            '</span><a href="#" class="btn-fix">Fix It</a>';
        } else {
          return value;
        }
      };

      self.fixRedundantConceptSet = function(value, parent, event){
        event.preventDefault();
        self.onFixCallback(value);
        self.onDiagnose();
      };

      function showWarnings(result){
        self.warnings(result.warnings);
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