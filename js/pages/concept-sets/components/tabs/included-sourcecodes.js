define([
	'knockout',
	'text!./included-sourcecodes.html',
	'components/Component',
	'utils/CommonUtils',
	'services/ConceptSet',
	'atlas-state',
	'const',
], function (
	ko,
	view,
	Component,
	commonUtils,
	conceptSetService,
	sharedState,
	globalConstants,
) {
	class IncludedSourcecodes extends Component {
		constructor(params) {
			super(params);
			this.loading = ko.pureComputed(() => {
				return sharedState.loadingSourcecodes() || sharedState.loadingIncluded();
			});
			this.includedSourcecodes = sharedState.includedSourcecodes;
			this.canEditCurrentConceptSet = params.canEditCurrentConceptSet;
			this.relatedSourcecodesColumns = globalConstants.getRelatedSourcecodesColumns(sharedState, this);
		}

	}

	return commonUtils.build('included-sourcecodes', IncludedSourcecodes, view);
});