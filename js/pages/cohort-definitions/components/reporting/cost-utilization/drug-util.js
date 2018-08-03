define(
  [
    'knockout',
    'text!./drug-util.html',
    './base-drug-util-report',
    'utils/CommonUtils',
    'appConfig',
    'less!./drug-util.less',
    './drug-util-summary',
    './drug-util-detailed',
  ],
  function (
    ko,
    view,
    BaseDrugUtilReport,
    commonUtils
  ) {

    const componentName = 'cost-utilization-drug-util';

    const modes = {
      summary: 'summary',
      detailed: 'detailed',
    };

    class DrugUtilReport extends BaseDrugUtilReport {

      constructor(params) {
        super(params);
        this.onDrugSelect = this.onDrugSelect.bind(this);
        this.displaySummary = this.displaySummary.bind(this);

        this.cohortId = params.cohortId;
        this.window = params.window;
        
        this.source = params.source;

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

    return commonUtils.build(componentName, DrugUtilReport, view);
  }
);
