define([
	'knockout', 
	'text!./MatchArgsEditor.html',	
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
	class MatchArgsEditor extends Component {
		constructor(params) {
            super(params);

			this.matchArgs = params.matchArgs;
            this.options = options;

            this.hasCovariateIds = ko.pureComputed(() => { 
				return (this.matchArgs.covariateIds !== undefined)
            });
		}
	}

	return commonUtils.build('match-args-editor', MatchArgsEditor, view);
});