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
	'components/dataSourceSelect'
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
			this.selectedSource = params.selectedSource;
			this.includedSourcecodes = this.conceptSetStore.includedSourcecodes;
			this.relatedSourcecodesColumns = globalConstants.getRelatedSourcecodesColumns(sharedState, { canEditCurrentConceptSet: this.canEdit },
				(data, selected) => {
					const conceptIds = data.map(c => c.CONCEPT_ID);
					ko.utils.arrayForEach(this.includedSourcecodes(), c => conceptIds.indexOf(c.CONCEPT_ID) > -1 && c.isSelected(selected));
					this.includedSourcecodes.valueHasMutated();
				});
			this.relatedSourcecodesOptions = globalConstants.relatedSourcecodesOptions;
			this.tableOptions = params.tableOptions || commonUtils.getTableOptions('M');
			this.canAddConcepts = ko.pureComputed(() => this.includedSourcecodes() && this.includedSourcecodes().some(item => item.isSelected()));
		}

		getSelectedConcepts() {
			return ko.unwrap(this.includedSourcecodes) && commonUtils.getSelectedConcepts(this.includedSourcecodes);
		}

		addConcepts(options) {
			this.conceptSetStore.loadingSourceCodes(true);
			const items = commonUtils.buildConceptSetItems(this.getSelectedConcepts(), options);
			conceptSetUtils.addItemsToConceptSet({
				items,
				conceptSetStore: this.conceptSetStore,
			});
			commonUtils.clearConceptsSelectionState(this.includedSourcecodes);
		}
	}

	return commonUtils.build('conceptset-list-included-sourcecodes', IncludedSourcecodes, view);
});