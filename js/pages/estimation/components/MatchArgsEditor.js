define([
	'knockout', 
	'text!./MatchArgsEditor.html',	
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
	class MatchArgsEditor extends Component {
		constructor(params) {
            super(params);

			this.matchArgs = params.matchArgs;
            this.options = options;

			// TODO: At the moment, we do not expose the ability
			// to edit Match/Stratify by covariate arguments
			// and if we do, we need to format the covariate
			// ID list as numbers
            this.hasCovariateIds = ko.pureComputed(() => { 
				return (this.matchArgs.covariateIds !== undefined)
            });
		}
	}

	return commonUtils.build('match-args-editor', MatchArgsEditor, view);
});