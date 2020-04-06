define(['knockout', 'text!./warnings.html',
    './const',
    './utils',
    'atlas-state',
    './warnings-badge',
    'databindings',
    'faceted-datatable',
    'css!./style.css',
  ],
  function (ko, view, consts, utils, sharedState) {

    function warningComponent(params){
      const self = this;
      self.current = params.current;
      self.currentId = params.currentId || ko.observable(-1);
      self.checkCallback = params.onCheckCallback || function() {};
      self.diagnoseCallback = params.onDiagnoseCallback || function() {};
      self.warningsTotal = params.warningsTotal || ko.observable();
      self.infoCount = params.infoCount || ko.observable();
      self.warningCount = params.warningCount || ko.observable();
      self.criticalCount = params.criticalCount || ko.observable();
      self.onFixCallback = params.onFixCallback || function() {};
      self.canDiagnose = params.canDiagnose || ko.observable(false);
      self.warnings = ko.observableArray();
      self.loading = ko.observable(false);
      self.isFixCalled = false;
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

      self.stateSaveCallback = function(settings, data){
        if (!self.isFixCalled){
          self.state = data;
        }
      };

      self.stateLoadCallback = function(settings, callback) {
        return self.state;
      };

      self.fixWarning = function(value, parent, event){
        self.isFixCalled = true;
        event.preventDefault();
        self.onFixCallback(value);
        self.onDiagnose();
        self.isFixCalled = false;
      };

      function showWarnings(result){
      	const count = (severity) => result.warnings.filter(w => w.severity === severity).length;
        self.warnings(result.warnings);
        self.infoCount(count(consts.WarningSeverity.INFO));
        self.warningCount(count(consts.WarningSeverity.WARNING));
        self.criticalCount(count(consts.WarningSeverity.CRITICAL));
        self.warningsTotal(result.warnings.length);
        self.loading(false);
      }

      function handleError() {
        self.warningsTotal(0);
        self.warnings.removeAll();
        self.loading(false);
      }

      self.runDiagnostics = function(id, expression){
        self.loading(true);
        self.diagnoseCallback(id, expression)
          .then(showWarnings, handleError);
      };

      self.getWarnings = function() {
        if (parseInt(self.currentId(), 10) <= 0 || isNaN(self.currentId())) {
          return false;
        }
        self.loading(true);
        self.checkCallback(self.currentId())
          .then(showWarnings, handleError);
      };

      self.onDiagnose = function(){
        self.runDiagnostics(self.currentId(), self.current());
      };


      self.warningSubscription = self.current.subscribe(() => self.getWarnings());

      self.getWarnings();

      self.dispose = function() {
        self.warningSubscription.dispose();
      }
    }

    var component = {
      viewModel: warningComponent,
      template: view,
      synchronous: true,
    };

    ko.components.register('warnings', component);
    return component;
  }
);