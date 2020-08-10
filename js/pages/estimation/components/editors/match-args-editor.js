define([
	'knockout', 
	'text!./match-args-editor.html',	
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
	class MatchArgsEditor extends Component {
		constructor(params) {
            super(params);

			this.matchArgs = params.matchArgs;
			this.options = constants.options;
			this.isEditPermitted = params.isEditPermitted;

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