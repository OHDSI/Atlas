define([
	'knockout',
	'text!./included-sourcecodes.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'atlas-state',
	'const',
	'services/ConceptSet',
	'./utils',	
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
	conceptSetUtils,	 
){

	class IncludedSourcecodes extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.loading = params.loading;
			this.canEdit = params.canEdit;
			this.conceptSetStore = params.conceptSetStore;
			
			this.relatedSourcecodesColumns = globalConstants.getRelatedSourcecodesColumns(sharedState, { canEditCurrentConceptSet: this.canEdit });
			this.relatedSourcecodesOptions = globalConstants.relatedSourcecodesOptions;
			this.includedSourcecodes = this.conceptSetStore.includedSourcecodes;
			this.tableOptions = params.tableOptions || commonUtils.getTableOptions('M');
			this.canAddConcepts = ko.pureComputed(() => this.includedSourcecodes() && this.includedSourcecodes().some(item => item.isSelected()));
		}

		addConcepts(options) {
			this.conceptSetStore.loadingSourceCodes(true);
			const concepts = commonUtils.getSelectedConcepts(this.includedSourcecodes);
			const items = commonUtils.buildConceptSetItems(concepts, options);
			conceptSetUtils.addItemsToConceptSet({
				items,
				conceptSetStore: this.conceptSetStore,
			});
			commonUtils.clearConceptsSelectionState(this.includedSourcecodes);
		}
	}

	return commonUtils.build('conceptset-list-included-sourcecodes', IncludedSourcecodes, view);
});