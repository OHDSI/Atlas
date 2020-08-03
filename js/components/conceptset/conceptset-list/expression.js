define([
	'knockout',
	'text!./expression.html',
	'appConfig',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'components/conceptset/utils',
	'services/AuthAPI',
	'services/ConceptSet',
	'atlas-state',
	'conceptsetbuilder/InputTypes/ConceptSetItem',
	'conceptset-editor',
	'conceptset-modal',
	'less!./expression.less',
], function(
	ko,
	view,
	config,
	Component,
	AutoBind,
	commonUtils,
	conceptSetUtils,
	authApi,
	conceptSetService,
	sharedState,
	ConceptSetItem,
) {

	class ConceptSetExpression extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.conceptSetListTableApi = params.conceptSetListTableApi || ko.observable();
			this.canEdit = params.canEdit || (() => false);
			this.conceptSets = params.conceptSets;
			this.currentConceptSet = params.currentConceptSet;
			this.currentConceptSetSource = params.currentConceptSetSource;
			this.currentConceptSetStoreKey = `${this.currentConceptSetSource}ConceptSet`;
			this.loading = params.loading;
			this.selectedConcepts = sharedState[this.currentConceptSetStoreKey].selectedConcepts;
			this.authApi = authApi;
			this.canCreateConceptSet = ko.computed( () => {
				return ((this.authApi.isAuthenticated() && this.authApi.isPermittedCreateConceptset()) || !config.userAuthenticationEnabled);
			});
			this.newConceptSetName = ko.observable();
			this.saveConceptSetShow = ko.observable();
			this.conceptsForRemovalLength = ko.pureComputed(() => this.data().filter(concept => concept.isSelected()).length);
			this.data = ko.observable(this.normalizeData());
			this.data.subscribe(this.updateExpressionItems);
			this.selectedConcepts.subscribe(val => this.data(this.normalizeData()));
		}

		normalizeData() {
      return this.selectedConcepts().map((concept, idx) => ({ ...concept, idx, isSelected: ko.observable(!!ko.unwrap(concept.isSelected)) }));
		}
		
		updateExpressionItems(items) {
			if (this.currentConceptSet()) {
				const conceptSet = this.conceptSets().find(cs => cs.id === this.currentConceptSet().id);
				if (conceptSet) {
					const expressionItems = conceptSet.expression.items;
					const conceptsIdx = items.map(i => i.idx);
					const expressionItemsIndexes = expressionItems().map(i => i.idx);
						items.forEach(item => {
							if (!expressionItemsIndexes.includes(item.idx)) {
								const { idx, ...concept } = ko.toJS(item);
								expressionItems.push(new ConceptSetItem(concept, idx));
							} 
						});
						expressionItems.remove(item => !conceptsIdx.includes(item.idx));
				}
				
			}
		}

		findConceptSet() {
			return this.conceptSets().find(cs => cs.id === this.currentConceptSet().id);
		}

		closeConceptSet() {
			const currentId = this.currentConceptSet() && this.currentConceptSet().id;
			conceptSetService.clearConceptSet({ source: this.currentConceptSetSource });
			this.conceptSetListTableApi() && this.conceptSetListTableApi()
				.getRows((idx, data) => data.id === currentId).deselect();
		}

		deleteConceptSet() {
			if (this.currentConceptSet() && confirm(`Do you want to delete ${this.currentConceptSet().name()}?`)) {
				this.conceptSets(this.conceptSets().filter(item => item.id !== this.currentConceptSet().id));
				this.closeConceptSet();
			}
		}

		showSaveConceptSet() {
			this.newConceptSetName(this.currentConceptSet().name());
			this.saveConceptSetShow(true);
		}

		addConcepts() {
			sharedState.activeConceptSet(sharedState[this.currentConceptSetStoreKey]);
			commonUtils.routeTo('#/search');
		}

		deleteConcepts() {
			const conceptsForRemoval = this.data().filter(concept => concept.isSelected());
			const indexesForRemoval = conceptsForRemoval.map(concept => concept.idx);
      conceptSetService.removeConceptsFromConceptSet({
        concepts: conceptsForRemoval,
        source: this.currentConceptSetSource,
			});
      const data = this.data().filter(({ concept}) => !indexesForRemoval.includes(concept.idx));
      this.data(data);
		}

		async saveConceptSet() {
			this.saveConceptSetShow(false);
			const conceptSet = {
				id: 0,
				name: this.newConceptSetName()
			};
			const conceptSetItems = conceptSetUtils.toConceptSetItems(this.selectedConcepts());
			const { data } = await conceptSetService.saveConceptSet(conceptSet);
			conceptSetService.saveConceptSetItems(data.id, conceptSetItems);
		}
	}

	return commonUtils.build('conceptset-list-expression', ConceptSetExpression, view);
});