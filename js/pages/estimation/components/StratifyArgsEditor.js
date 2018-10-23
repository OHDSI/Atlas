define([
	'knockout', 
	'text!./StratifyArgsEditor.html',	
	'components/Component',
	'utils/CommonUtils',
	'../options',
	'databindings',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	options,
) {
	class StratifyArgsEditor extends Component {
		constructor(params) {
            super(params);

			this.stratifyArgs = params.stratifyArgs;
			this.options = options;
			
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