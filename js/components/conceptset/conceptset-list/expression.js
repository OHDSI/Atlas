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