define([
	'knockout',
	'text!./included.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'atlas-state',
	'services/ConceptSet',
	'const',
	'components/conceptAddBox/concept-add-box',
], function (
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	sharedState,
	conceptSetService,
	globalConstants,
) {

	class IncludedConcepts extends AutoBind(Component){
		constructor(params) {
			super(params);
			this.canEdit = params.canEdit;
			this.currentConceptSetSource = params.currentConceptSetSource;
			this.includedConcepts = sharedState[`${this.currentConceptSetSource}ConceptSet`].includedConcepts;
			this.commonUtils = commonUtils;
			this.loading = params.loading;
			this.includedConceptsColumns = globalConstants.getIncludedConceptsColumns(sharedState, { canEditCurrentConceptSet: this.canEdit }, commonUtils, conceptSetService);
			this.includedConceptsOptions = globalConstants.includedConceptsOptions;
			this.canAddConcepts = ko.pureComputed(() => this.includedConcepts().some(item => item.isSelected()));
		}

		addConcepts = (options) => {
      const concepts = commonUtils.getSelectedConcepts(this.includedConcepts, options);
			conceptSetService.addConceptsToConceptSet({
				concepts,
				source: globalConstants.conceptSetSources[this.currentConceptSetSource],
			});
			commonUtils.clearConceptsSelectionState(this.includedConcepts);
    }
	}

	return commonUtils.build('conceptset-list-included', IncludedConcepts, view);
});