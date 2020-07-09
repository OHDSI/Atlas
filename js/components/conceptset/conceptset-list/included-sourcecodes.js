define([
	'knockout',
	'text!./included-sourcecodes.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'atlas-state',
	'const',
	'services/ConceptSet',
	'components/conceptAddBox/concept-add-box',
], function(
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	sharedState,
	globalConstants,
	conceptSetService,
){

	class IncludedSourcecodes extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.loading = params.loading;
			this.canEdit = params.canEdit;
			this.currentConceptSetSource = params.currentConceptSetSource;
			
			this.relatedSourcecodesColumns = globalConstants.getRelatedSourcecodesColumns(sharedState, { canEditCurrentConceptSet: this.canEdit });
			this.relatedSourcecodesOptions = globalConstants.relatedSourcecodesOptions;
			this.includedSourcecodes = sharedState[`${this.currentConceptSetSource}ConceptSet`].includedSourcecodes;
			this.canAddConcepts = ko.pureComputed(() => this.includedSourcecodes().some(item => item.isSelected()));
		}

		addConcepts = (options) => {
      const concepts = this.includedSourcecodes()
        .filter(concept => concept.isSelected())
        .map(concept => ({
          ...concept,
          ...options,
        }));
        conceptSetService.addConceptsToConceptSet({
          concepts,
          source: globalConstants.conceptSetSources[this.currentConceptSetSource],
        });
        this.clearCheckboxes();
    }

    clearCheckboxes() {
      const concepts = this.includedSourcecodes().map(concept => concept.isSelected(false));
      this.includedSourcecodes(concepts);
    }
	}

	return commonUtils.build('conceptset-list-included-sourcecodes', IncludedSourcecodes, view);
});