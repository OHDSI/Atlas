define([
	'knockout',
	'text!./import.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'atlas-state',
	'services/VocabularyProvider',
	'./utils',
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
	conceptSetUtils,
){

	class ConceptSetImport extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.conceptSetStore = params.conceptSetStore;		
			this.loading = params.loading;
			//this.conceptSets = params.conceptSets;
			this.loadConceptSet = params.loadConceptSet;
			this.importing = params.importing || ko.observable(false);
			//this.criteriaContext = sharedState.criteriaContext;
			this.currentConceptSet = this.conceptSetStore.current;

			this.showImportConceptSetModal = ko.observable();
			this.selectedTabKey = ko.observable('concept-identifiers');
			this.tabs = [
				{
					title: 'Concept Identifiers',
					key: 'concept-identifiers',
					componentName: 'conceptset-list-import-identifiers',
					componentParams: {...params, appendConcepts: this.appendConcepts}
				},
				{
					title: 'Source Codes',
					key: 'concept-sourcecodes',
					componentName: 'conceptset-list-import-sourcecodes',
					componentParams: {...params,appendConcepts: this.appendConcepts}
				},
				{
					title: 'Concept Set',
					key: 'conceptset',
					componentName: 'conceptset-list-import-conceptset',
					componentParams: {...params,importConceptSetExpression: this.importConceptSetExpression}
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

		async onConceptSetRepositoryImport(newConceptSet) {
			this.showImportConceptSetModal(false);
			this.importing(true);
			if (this.currentConceptSet().expression.items().length == 0 || confirm("Your concept set expression will be replaced with new one. Would you like to continue?")) {
				const expression = await vocabularyApi.getConceptSetExpression(newConceptSet.id)
				this.currentConceptSet().name(newConceptSet.name);
				this.currentConceptSet().expression.items([]);
				this.importConceptSetExpression(expression);	
			}
			this.importing(false);
		}

		async importConceptSetExpression (expression) {
			conceptSetUtils.addItemsToConceptSet({
				items: expression.items,
				conceptSetStore: this.conceptSetStore,
			});
			await this.loadConceptSet(this.conceptSetStore.current().id);
		}

		appendConcepts(concepts, options) {
			const items = commonUtils.buildConceptSetItems(concepts, options);
			conceptSetUtils.addItemsToConceptSet({
				items,
				conceptSetStore: this.conceptSetStore,
			});
		}
	}

	return commonUtils.build('conceptset-list-import', ConceptSetImport, view);
});