define([
	'knockout',
	'text!./recommend.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'atlas-state',
	'./utils',	
	'components/conceptAddBox/concept-add-box',
], function(
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	sharedState,
	utils,	
) {

	class ConceptSetRecommend extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.loading = params.loading;
			this.canEdit = params.canEdit;
			this.conceptSetStore = params.conceptSetStore;
			
			this.recommendedConcepts = this.conceptSetStore.recommendedConcepts;
			this.recommendedConceptOptions = utils.recommendedConceptOptions;
			this.recommendedConceptColumns = utils.getRecommendedConceptColumns(sharedState, { canEditCurrentConceptSet: this.canEdit },
				(data, selected) => {
					const conceptIds = data.map(c => c.CONCEPT_ID);
					ko.utils.arrayForEach(this.recommendedConcepts(), c => conceptIds.indexOf(c.CONCEPT_ID) > -1 && c.isSelected(selected));
					this.recommendedConcepts.valueHasMutated();
				}
			);
			this.tableOptions = params.tableOptions || commonUtils.getTableOptions('M');
			this.canAddConcepts = ko.pureComputed(() => this.recommendedConcepts() && this.recommendedConcepts().some(item => item.isSelected()));
		}

		addConcepts(options) {
			this.conceptSetStore.loadingRecommended(true);
			const concepts = commonUtils.getSelectedConcepts(this.recommendedConcepts);
			const items = commonUtils.buildConceptSetItems(concepts, options);
			utils.addItemsToConceptSet({
				items,
				conceptSetStore: this.conceptSetStore,
			});
			commonUtils.clearConceptsSelectionState(this.recommendedConcepts);
		}
	}

	return commonUtils.build('conceptset-recommend', ConceptSetRecommend, view);
});