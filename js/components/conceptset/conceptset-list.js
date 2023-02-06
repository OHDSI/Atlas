define([
	'knockout',
	'text!./conceptset-list.html',
	'appConfig',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'atlas-state',
	'services/ConceptSet',
	'./utils',
	'./InputTypes/ConceptSet',
	'./const',
	'utils/ExceptionUtils',
	'const',
	'components/tabs',
	'./expression',
	'./included',
	'./included-badge',
	'./included-sourcecodes',
	'./recommend',
	'./export',
	'./import',
	'less!./conceptset-list.less',
], function(
	ko,
	view,
	config,
	Component,
	AutoBind,
	commonUtils,
	sharedState,
	conceptSetService,
	conceptSetUtils,
	ConceptSet,
	constants,
	exceptionUtils,
	globalConstants
) {

	const {ViewMode, RESOLVE_OUT_OF_ORDER} = constants;
	
	class ConceptSetList extends AutoBind(Component) {

		constructor(params) {
			super(params);
			this.conceptSets = params.conceptSets;
			this.exportCSV = typeof params.exportCSV !== 'undefined' ? params.exportCSV : true;
			this.conceptSetStore = params.conceptSetStore;
			this.selectedSource = ko.observable();
			this.canEdit = params.canEdit || (() => false);
			this.exportConceptSets = params.exportConceptSets || (() => false);
			this.currentConceptSet = this.conceptSetStore.current;
			this.showImportConceptSetModal = ko.observable();
			this.exporting = ko.observable();
			this.importing = ko.observable();
			this.disableConceptSetExport = ko.observable(); //TODO implement export
			this.disableConceptSetExportMessage = ko.observable();
			this.currentCohortDefinitionMode = sharedState.CohortDefinition.mode;
			this.loading = ko.observable();
			this.tableApi = ko.observable();
			const tableOptions = params.tableOptions || commonUtils.getTableOptions('M');
			this.options = {
				deferRender: true,
				orderClasses: false,
				autoWidth: false,
				order: [ 1, 'asc' ],
				...commonUtils.getTableOptions('S'),
				columnDefs: [
					{ width: '25px', targets: 0},
					{ width: '100%', targets: 1},
				],
				stripeClasses : [ 'repositoryConceptSetItem' ],
				columns: [
					{ data: 'id', title: 'Id', width: '25px'},
					this.getDataboundColumn('name', 'Title', '100%')
				],
				language: ko.i18n('datatable.language'),
				select: {
					style: 'single',
					info: false,
					toggleable: false,
				},
			};
			this.selectedTabKey = ko.observable(ViewMode.EXPRESSION);
			const tabParams = {
				...params,
				tableOptions,
				conceptSetStore: this.conceptSetStore,
				selectedSource: this.selectedSource,
				activeConceptSet: ko.observable(this.conceptSetStore), // addConceptBox expectes an observable for activeConceptSet
				currentConceptSet: this.conceptSetStore.current,
				loadConceptSet: this.loadConceptSet,
				importing: this.importing,
				selectedTabKey: this.selectedTabKey,
				canEdit: this.canEdit,
			};
			this.tabs = [
				{
					title: ko.i18n('components.conceptSet.conceptSetExpression', 'Concept Set Expression'),
					key: ViewMode.EXPRESSION,
					componentName: 'conceptset-list-expression',
					componentParams: {...tabParams, onClose: this.closeConceptSet, onDelete: this.deleteConceptSet, loading: this.loading}
				},
				{
					title: ko.i18n('components.conceptSet.includedConcepts', 'Included Concepts'),
					key: ViewMode.INCLUDED,
					componentName: 'conceptset-list-included',
					componentParams: {...tabParams, loading: ko.pureComputed(() => (this.conceptSetStore.loadingIncluded() || this.loading()))},
					hasBadge: true,
				},
				{
					title: ko.i18n('components.conceptSet.includedSourceCodes', 'Included Source Codes'),
					key: ViewMode.SOURCECODES,
					componentName: 'conceptset-list-included-sourcecodes',
					componentParams: {...tabParams, loading: ko.pureComputed(() => (this.conceptSetStore.loadingSourceCodes() || this.loading()))}
				},
				{
					title: ko.i18n('cs.manager.tabs.recommend', 'Recommend'),
					key: ViewMode.RECOMMEND,
					componentName: 'conceptset-recommend',
					componentParams: {
						...tabParams, loading: ko.pureComputed(() => (this.conceptSetStore.loadingRecommended() || this.loading()))
					}
				},
				{
					title: ko.i18n('common.export', 'Export'),
					key: ViewMode.EXPORT,
					componentName: 'conceptset-list-export',
					componentParams: tabParams,
				},
				{
					title: ko.i18n('common.import', 'Import'),
					key: ViewMode.IMPORT,
					componentName: 'conceptset-list-import',
					componentParams: tabParams,
				}
			];
			
			// watch for the tableApi beign published back
			this.subscriptions.push(this.tableApi.subscribe(() => {
				this.currentConceptSet() && this.markConceptSetSelected(this.conceptSetStore.current());
			}));
			
			// watch for any change to expression items (observer has a delay)
			this.subscriptions.push(this.conceptSetStore.observer.subscribe(async () => {
				// when the conceptSetStore changes (either through a new concept set being selected or changes to concept set options), the concept set resolves and the view is refreshed.
				// this must be done within the same subscription due to the asynchronous nature of the AJAX and UI interface (ie: user can switch tabs at any time)
				try {
					await this.conceptSetStore.resolveConceptSetExpression();
					await this.conceptSetStore.refresh(this.selectedTabKey());
				} catch (err) {
					if (err == RESOLVE_OUT_OF_ORDER)
						console.info(err);
					else
						throw(err);
				}
			}));

			// initially resolve the concept set
			this.conceptSetStore.resolveConceptSetExpression();

			
			
			this.subscriptions.push(this.conceptSetStore.current.subscribe(() => {
				this.currentConceptSet() && this.markConceptSetSelected(this.conceptSetStore.current());
			}));
			
		}

		getDataboundColumn(field, title, width) {
			return {
				data: field,
				title: title,
				width: width,
				render: function (data,type,row) {
					return (type === "display")	? `<span data-bind='text: ${field}'></span>`
						: ko.utils.unwrapObservable(data);
				}
			};
		}

		async selectConceptSet(conceptSet) {
			sharedState.activeConceptSet(this.conceptSetStore);
			this.showImportConceptSetModal(false);
			if (conceptSet.id !== (this.currentConceptSet() && this.currentConceptSet().id)) {
				this.selectedTabKey(ViewMode.EXPRESSION);
				await this.loadConceptSet(conceptSet.id);
			}
		}

		async loadConceptSet(conceptSetId) {
			this.conceptSetStore.current(null);
			this.selectedTabKey(ViewMode.EXPRESSION);
			const conceptSet = this.conceptSets().find(item => item.id === conceptSetId);
			if (!conceptSet) {
				return;
			}
			this.conceptSetStore.current(conceptSet);
			this.conceptSetStore.isEditable(this.canEdit());
		}

		createConceptSet() {
			const newConceptSet = new ConceptSet();
			const conceptSets = ko.unwrap(this.conceptSets);
			newConceptSet.id = conceptSets.length > 0 ? Math.max(...conceptSets.map(c => c.id)) + 1 : 0;
			return newConceptSet;
		}

		async prepareConceptSet(conceptSet) {
			this.conceptSets(this.conceptSets().concat([conceptSet]));
			ko.tasks.runEarly();
			await this.loadConceptSet(conceptSet.id);
			this.currentCohortDefinitionMode("conceptsets");
		}

		conceptSetPredicate(conceptSet) {
			return (idx, data) => data.id === conceptSet.id;
		}

		markConceptSetSelected(conceptSet) {
			this.tableApi() && this.tableApi().getRows(this.conceptSetPredicate(conceptSet)).select();
		}

		newConceptSet () {
			const conceptSet = this.createConceptSet();
			this.prepareConceptSet(conceptSet);
			this.markConceptSetSelected(conceptSet);
		};

		async importConceptSet () {
			const conceptSet = this.createConceptSet();
			await this.prepareConceptSet(conceptSet);
			this.selectedTabKey(ViewMode.IMPORT);
			this.markConceptSetSelected(conceptSet);
			
		};

		async selectTab(tab) {
			const key = this.tabs[tab].key;
			this.selectedTabKey(key);
			this.loading(true);
			try {
				await this.conceptSetStore.refresh(key);
			} finally {
				this.loading(false);
			}
		}
		
		closeConceptSet() {
			const currentId = this.currentConceptSet() && this.currentConceptSet().id;
			this.tableApi() && this.tableApi()
				.getRows((idx, data) => data.id === currentId).deselect();
			this.conceptSetStore.current(null);
			if (this.conceptSetStore == sharedState.activeConceptSet()) {
				sharedState.activeConceptSet(null);
			}
		}

		deleteConceptSet() {
			if (this.currentConceptSet() && confirm(ko.i18nformat('components.conceptSet.deleteConfirm', 'Do you want to delete <%=name%>?', {name: this.currentConceptSet().name()})())) {
				this.conceptSets(this.conceptSets().filter(item => item.id !== this.currentConceptSet().id));
				this.closeConceptSet();
			}
		}		

		async exportConceptSetCSV() {
			this.exporting(true);
			try {
				await this.exportConceptSets();
			} catch(e) {
					alert(exceptionUtils.translateException(e));
			} finally {
				this.exporting(false);
			}
		}

	}

	return commonUtils.build('conceptset-list', ConceptSetList, view);
});