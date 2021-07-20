define([
	'knockout',
	'text!./import.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'atlas-state',
	'services/VocabularyProvider',
	'./utils',
	'./const',
	'components/tabs',
	'./import/identifiers',
	'./import/sourcecodes',
	'./import/conceptset',
	'less!./import.less',
],function(
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	sharedState,
	vocabularyApi,
	conceptSetUtils,
	constants,
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
			this.canEdit = params.canEdit;
			this.showImportConceptSetModal = ko.observable();
			this.isImportTypeOverwrite = ko.observable(true);
			this.selectedTabKey = ko.observable('concept-identifiers');
			this.tableOptions = commonUtils.getTableOptions('M');
			this.tabs = [
				{
					title: ko.i18n('components.conceptSet.conceptIdentifiers', 'Concept Identifiers'),
					key: 'concept-identifiers',
					componentName: 'conceptset-list-import-identifiers',
					componentParams: {...params, appendConcepts: this.appendConcepts}
				},
				{
					title: ko.i18n('components.conceptSet.sourceCodes', 'Source Codes'),
					key: 'concept-sourcecodes',
					componentName: 'conceptset-list-import-sourcecodes',
					componentParams: {...params,appendConcepts: this.appendConcepts}
				},
				{
					title: ko.i18n('components.conceptSet.conceptSet', 'Concept Set'),
					key: 'conceptset',
					componentName: 'conceptset-list-import-conceptset',
					componentParams: {...params,importConceptSetExpression: this.importConceptSetExpression}
				},
				{
					title: ko.i18n('components.conceptSet.repository', 'Repository'),
					key: 'repository',
				}
			];
		}

		selectTab(index) {
			const key = this.tabs[index].key;
			if (key === 'repository') {
				if(this.canEdit()) {
					this.showImportConceptSetModal(true);
				} else {
					alert(conceptSetUtils.getPermissionsText(false, ko.i18n('components.conceptSet.actionEdit', 'edit')()));
				}
			} else {
				this.selectedTabKey(this.tabs[index].key);
			}
		}

		async onConceptSetRepositoryImport(newConceptSet) {
			this.showImportConceptSetModal(false);
			this.importing(true);
			let importType = this.isImportTypeOverwrite() ? constants.importTypes.OVERWRITE : constants.importTypes.APPEND;
			if (this.currentConceptSet().expression.items().length === 0 || this.confirmAction(importType)) {
				const expression = await vocabularyApi.getConceptSetExpression(newConceptSet.id);
				if (importType === constants.importTypes.OVERWRITE) {
					this.currentConceptSet().expression.items([]);
				}
				this.importConceptSetExpression(expression, {type: constants.importTypes.APPEND}); // indicating 'append' because we handled the overwrite already.	
			}
			this.importing(false);
		}

		async importConceptSetExpression (expression, options) {
			if (this.currentConceptSet().expression.items().length == 0 
					|| options.type == constants.importTypes.APPEND
					|| this.confirmAction(options.type)) {
				
				if (options.type == constants.importTypes.OVERWRITE) {
					this.conceptSetStore.expression().items([]);
				}
				conceptSetUtils.addItemsToConceptSet({
					items: expression.items,
					conceptSetStore: this.conceptSetStore,
				});
				await this.loadConceptSet(this.conceptSetStore.current().id);

			}
		}

		appendConcepts(concepts, options) {
			const items = commonUtils.buildConceptSetItems(concepts, options);
			conceptSetUtils.addItemsToConceptSet({
				items,
				conceptSetStore: this.conceptSetStore,
			});
		}
		
    confirmAction(type) {
      let isConfirmed = true;
      if(type === constants.importTypes.OVERWRITE) {
        isConfirmed = confirm(ko.i18n('components.conceptSet.overwriteConfirm', 'Are you sure you want to overwrite current Concept Set Expression?')());
      }
      return isConfirmed;
    }

	}

	return commonUtils.build('conceptset-list-import', ConceptSetImport, view);
});