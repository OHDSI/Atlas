define(
  [
    'knockout',
    'text!./drug-util.html',
    'appConfig',
    'utils/BemHelper',
    'less!./drug-util.less',
    './drug-util-summary',
    './drug-util-detailed',
  ],
  function (ko, view, appConfig, BemHelper) {

    const componentName = 'cost-utilization-drug-util';

    const modes = {
      summary: 'summary',
      detailed: 'detailed',
    };

    class DrugUtilReport {

      constructor(params) {

        this.onDrugSelect = this.onDrugSelect.bind(this);
        this.displaySummary = this.displaySummary.bind(this);

        // Styling
        const bemHelper = new BemHelper(componentName);
        this.classes = bemHelper.run.bind(bemHelper);

        // Input params
        this.source = params.source;
        this.cohortId = params.cohortId;
        this.window = params.window;

        //
        this.modes = modes;
        this.currentMode = ko.observable(modes.summary);

        this.drugConceptId = ko.observable(null);
        this.drugName = ko.observable(null);
      }

      onDrugSelect({ drugId, drugName }) {
        this.drugConceptId(drugId);
        this.drugName(drugName);
        this.currentMode(modes.detailed);
      }

      displaySummary() {
        this.currentMode(modes.summary);
      }
    }

    const component = {
      viewModel: DrugUtilReport,
      template: view
    };

    ko.components.register(componentName, component);
    return component;
  }
);
