define([
	'knockout',
	'text!./recommend.html',
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

	class Recommend extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.loading = params.loading;
			this.canEdit = params.canEdit;
			this.conceptSetStore = params.conceptSetStore;
			this.recommendConcepts = this.conceptSetStore.recommendConcepts;
			this.recommendedConceptsOptions = conceptSetUtils.recommendedConceptOptions;
			
			this.recommendedConceptsColumns = conceptSetUtils.getRecommendedConceptsColumns({ canEditCurrentConceptSet: this.canEdit }, commonUtils,
				(data, selected) => {
					const conceptIds = data.map(c => c.CONCEPT_ID);
					ko.utils.arrayForEach(this.recommendConcepts(), c => conceptIds.indexOf(c.CONCEPT_ID) > -1 && c.isSelected(selected));
					this.recommendConcepts.valueHasMutated();
				});
			this.tableOptions = params.tableOptions || commonUtils.getTableOptions('M');
			this.canAddConcepts = ko.pureComputed(() => this.recommendConcepts() && this.recommendConcepts().some(item => item.isSelected()));
		}

		addConcepts(options) {
			this.conceptSetStore.loadingSourceCodes(true);
			const concepts = commonUtils.getSelectedConcepts(this.recommendConcepts);
			const items = commonUtils.buildConceptSetItems(concepts, options);
			conceptSetUtils.addItemsToConceptSet({
				items,
				conceptSetStore: this.conceptSetStore,
			});
			commonUtils.clearConceptsSelectionState(this.recommendConcepts);
		}
	}

	return commonUtils.build('conceptset-recommend', Recommend, view);
});
