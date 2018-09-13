define([
	'knockout', 
	'text!./StratifyArgsEditor.html',	
	'providers/Component',
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

            this.hasCovariateIds = ko.pureComputed(() => { 
				return (this.stratifyArgs.covariateIds !== undefined)
            });
		}
	}

	return commonUtils.build('stratify-args-editor', StratifyArgsEditor, view);
});