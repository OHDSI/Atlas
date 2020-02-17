define([
	'knockout',
	'text!./import.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'atlas-state',
	'services/VocabularyProvider',
	'services/ConceptSet',
	'components/tabs',
	'./import/identifiers',
	'./import/sourcecodes',
	'./import/conceptset',
],function(
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	sharedState,
	vocabularyApi,
	conceptSetService,
){

	class ConceptSetImport extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.loading = params.loading;
			this.conceptSets = params.conceptSets;
			this.loadConceptSet = params.loadConceptSet;
			this.importing = params.importing;
			this.criteriaContext = sharedState.criteriaContext;
			this.currentConceptSet = sharedState.ConceptSet.current;
			this.tabParams = {
				...params,
				appendConcepts: this.appendConcepts,
				importConceptSetExpressionItems: this.importConceptSetExpressionItems,
			};
			this.showImportConceptSetModal = ko.observable();
			this.selectedTabKey = ko.observable('concept-identifiers');
			this.tabs = [
				{
					title: 'Concept Identifiers',
					key: 'concept-identifiers',
					componentName: 'conceptset-list-import-identifiers',
					componentParams: this.tabParams,
				},
				{
					title: 'Source Codes',
					key: 'concept-sourcecodes',
					componentName: 'conceptset-list-import-sourcecodes',
					componentParams: this.tabParams,
				},
				{
					title: 'Concept Set',
					key: 'conceptset',
					componentName: 'conceptset-list-import-conceptset',
					componentParams: this.tabParams,
				},
				{
					title: 'Repository',
					key: 'repository',
				}
			];
		}

		selectTab(index) {
			const key = this.tabs[index].key;
			if (key === 'repository') {
				this.showImportConceptSetModal(true);
			} else {
				this.selectedTabKey(this.tabs[index].key);
			}
		}

		findConceptSet() {
			return this.conceptSets().find(cs => cs.id === this.currentConceptSet().id);
		}

		onConceptSetRepositoryImport(newConceptSet) {
			this.showImportConceptSetModal(false);
			this.importing(true);
			vocabularyApi.getConceptSetExpression(newConceptSet.id)
				.done((result)=> {
					const conceptSet = this.findConceptSet();
					if (!conceptSet) {
						return;
					}
					conceptSet.name(newConceptSet.name);
					conceptSet.expression.items().forEach((item)=> {
						sharedState.selectedConceptsIndex[item.concept.CONCEPT_ID] = 0;
						sharedState.selectedConcepts.remove((v)=> {
							return v.concept.CONCEPT_ID === item.concept.CONCEPT_ID;
						});
					});
					conceptSet.expression.items().length = 0;
					this.importConceptSetExpressionItems(result.items);
					this.importing(false);
				});
		}

		async importConceptSetExpressionItems (items) {
			const conceptSet = this.findConceptSet();
			if (!conceptSet) {
				return;
			}

			const conceptSetItemsToAdd = sharedState.selectedConcepts();
			items.forEach((item)=> {
				const conceptSetItem = {};
				conceptSetItem.concept = item.concept;
				conceptSetItem.isExcluded = ko.observable(item.isExcluded);
				conceptSetItem.includeDescendants = ko.observable(item.includeDescendants);
				conceptSetItem.includeMapped = ko.observable(item.includeMapped);

				sharedState.selectedConceptsIndex[item.concept.CONCEPT_ID] = 1;
				conceptSetItemsToAdd.push(conceptSetItem);
			});
			sharedState.selectedConcepts(conceptSetItemsToAdd);
			await this.loadConceptSet(conceptSet.id);
		}

		appendConcepts(concepts) {
			const conceptSetItemsToAdd = sharedState.selectedConcepts();
			sharedState.clearSelectedConcepts();
			concepts.forEach((item) => {
				if (sharedState.selectedConceptsIndex[item.CONCEPT_ID] !== 1) {
					sharedState.selectedConceptsIndex[item.CONCEPT_ID] = 1;
					conceptSetItemsToAdd.push(commonUtils.createConceptSetItem(item));
				}
			});
			sharedState.selectedConcepts(conceptSetItemsToAdd);
			conceptSetService.resolveConceptSetExpression(true);
			if (this.conceptSets()) {
				const conceptSet = this.conceptSets()
					.find( (item) => {
						return item.id === this.currentConceptSet().id;
					});
				if (conceptSet) {
					conceptSet.expression.items.valueHasMutated();
				}
			}
		}
	}

	return commonUtils.build('conceptset-list-import', ConceptSetImport, view);
});