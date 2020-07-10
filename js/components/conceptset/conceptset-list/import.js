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
			this.currentConceptSetSource = params.currentConceptSetSource;
			this.currentConceptSetStoreKey = `${this.currentConceptSetSource}ConceptSet`;
			this.currentConceptSet = params.currentConceptSet;
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

		async onConceptSetRepositoryImport(newConceptSet) {
			this.showImportConceptSetModal(false);
			this.importing(true);
			const conceptSet = this.findConceptSet();
			if (conceptSet.expression.items().length == 0 || confirm("Your concept set expression will be replaced with new one. Would you like to continue?")) {
				conceptSet.name(newConceptSet.name);
				conceptSet.expression.items().forEach((item)=> {
					delete sharedState[this.currentConceptSetStoreKey].selectedConceptsIndex[item.concept.CONCEPT_ID];
					sharedState[this.currentConceptSetStoreKey].selectedConcepts.remove((v)=> {
						return v.concept.CONCEPT_ID === item.concept.CONCEPT_ID;
					});
				});
				conceptSet.expression.items().length = 0;
				const result = await vocabularyApi.getConceptSetExpression(newConceptSet.id)
				this.importConceptSetExpressionItems(result.items);	
			}
			this.importing(false);
		}

		async importConceptSetExpressionItems (items) {
			const conceptSet = this.findConceptSet();
			if (!conceptSet) {
				return;
			}

			const conceptSetItemsToAdd = sharedState[this.currentConceptSetStoreKey].selectedConcepts();
			items.forEach((item)=> {
				const conceptSetItem = {};
				conceptSetItem.concept = item.concept;
				conceptSetItem.isExcluded = ko.observable(item.isExcluded);
				conceptSetItem.includeDescendants = ko.observable(item.includeDescendants);
				conceptSetItem.includeMapped = ko.observable(item.includeMapped);

				sharedState[this.currentConceptSetStoreKey].selectedConceptsIndex[item.concept.CONCEPT_ID] = {
					isExcluded: conceptSetItem.isExcluded,
					includeDescendants: conceptSetItem.includeDescendants,
					includeMapped: conceptSetItem.includeMapped,
				};
				conceptSetItemsToAdd.push(conceptSetItem);
			});
			sharedState[this.currentConceptSetStoreKey].selectedConcepts(conceptSetItemsToAdd);
			conceptSet.expression.items(conceptSetItemsToAdd);
			await this.loadConceptSet(conceptSet.id);
		}

		appendConcepts(concepts) {
			const conceptSetItemsToAdd = sharedState[this.currentConceptSetStoreKey].selectedConcepts();
			sharedState.clearSelectedConcepts({ source: this.currentConceptSetSource });
			concepts.forEach((item) => {
				if (!sharedState[this.currentConceptSetStoreKey].selectedConceptsIndex[item.CONCEPT_ID]) {
					const conceptSetItem = commonUtils.createConceptSetItem(item);
					sharedState[this.currentConceptSetStoreKey].selectedConceptsIndex[item.CONCEPT_ID] = {
						isExcluded: conceptSetItem.isExcluded,
						includeDescendants: conceptSetItem.includeDescendants,
						includeMapped: conceptSetItem.includeMapped,
					};
					conceptSetItemsToAdd.push(conceptSetItem);
				}
			});
			sharedState[this.currentConceptSetStoreKey].selectedConcepts(conceptSetItemsToAdd);
			conceptSetService.resolveConceptSetExpression({ source: this.currentConceptSetSource });
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