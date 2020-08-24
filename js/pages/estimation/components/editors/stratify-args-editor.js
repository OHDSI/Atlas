define([
	'knockout', 
	'text!./stratify-args-editor.html',	
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
	class StratifyArgsEditor extends Component {
		constructor(params) {
            super(params);

			this.stratifyArgs = params.stratifyArgs;
			this.options = constants.options;
			this.isEditPermitted = params.isEditPermitted;
			
			// TODO: At the moment, we do not expose the ability
			// to edit Match/Stratify by covariate arguments
			// and if we do, we need to format the covariate
			// ID list as numbers
            this.hasCovariateIds = ko.pureComputed(() => { 
				return (this.stratifyArgs.covariateIds !== undefined)
            });
		}
	}

	return commonUtils.build('stratify-args-editor', StratifyArgsEditor, view);
});