define([
	'knockout', 
	'text!./negative-control-outcome-cohort-settings-editor.html',	
	'components/Component',
	'utils/CommonUtils',
	'../../const',
	'databindings',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	constants,
) {
	class NegativeControlOutcomeCohortSettingsEditor extends Component {
		constructor(params) {
      super(params);
			this.isEditPermitted = params.isEditPermitted;

			this.negativeControlCohortSettings = params.negativeControlCohortSettings;
            this.options = constants.options;
		}
	}

	return commonUtils.build('nc-outcome-cohort-settings-editor', NegativeControlOutcomeCohortSettingsEditor, view);
});