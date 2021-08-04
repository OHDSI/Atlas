define([
	'knockout',
	'text!./conceptset-manager.html',
	'pages/Page',
	'utils/AutoBind',
	'utils/CommonUtils',
	'appConfig',
	'./const',
	'const',
	'components/conceptset/utils',
	'services/Vocabulary',
	'services/Permission',
	'components/security/access/const',
	'conceptsetbuilder/InputTypes/ConceptSet',
	'conceptsetbuilder/InputTypes/ConceptSetItem',
	'atlas-state',
	'services/ConceptSet',
	'components/conceptset/ConceptSetStore',
	'components/conceptset/utils',
	'services/AuthAPI',
    'lodash',
	'databindings',
	'bootstrap',
	'faceted-datatable',
	'databindings',
	'evidence',
	'circe',
	'conceptset-modal',
	'less!./conceptset-manager.less',
	'components/heading',
	'components/tabs',
	'components/modal',
	'./components/tabs/conceptset-expression',
	'components/conceptset/included',
	'components/conceptset/included-sourcecodes',
	'components/conceptset/import',
	'components/conceptset/export',
	'./components/tabs/explore-evidence',
	'./components/tabs/conceptset-compare',
	'components/security/access/configure-access-modal',
	'components/authorship',
	'components/name-validation',
	'components/ac-access-denied',
], function (
	ko,
	view,
	Page,
	AutoBind,
	commonUtils,
	config,
	constants,
	globalConstants,
	utils,
	vocabularyAPI,
	GlobalPermissionService,
	{ entityType },
	ConceptSet,
	ConceptSetItem,
	sharedState,
	conceptSetService,
	ConceptSetStore,
	conceptSetUtils,
	authApi,
    lodash,
) {
  
  const { ViewMode, RESOLVE_OUT_OF_ORDER } = constants;
  
	class ConceptsetManager extends AutoBind(Page) {
		constructor(params) {
			super(params);
			this.commonUtils = commonUtils;
			this.conceptSetStore = ConceptSetStore.repository();
			this.currentConceptSet = ko.pureComputed(() => this.conceptSetStore.current());
			this.currentConceptSetDirtyFlag = sharedState.RepositoryConceptSet.dirtyFlag;
			this.currentConceptSetMode = sharedState.currentConceptSetMode;
			this.isOptimizeModalShown = ko.observable(false);
			this.defaultName = ko.unwrap(globalConstants.newEntityNames.conceptSet);
			this.loading = ko.observable();
			this.optimizeLoading = ko.observable();
			this.fade = ko.observable(false);

			this.canEdit = ko.pureComputed(() => {
				if (!authApi.isAuthenticated()) {
					return false;
				}

				if (this.currentConceptSet() && (this.currentConceptSet()
						.id !== 0)) {
					return authApi.isPermittedUpdateConceptset(this.currentConceptSet()
						.id) || !config.userAuthenticationEnabled;
				} else {
					return authApi.isPermittedCreateConceptset() || !config.userAuthenticationEnabled;
				}
			});
			this.isNameFilled = ko.computed(() => {
				return this.currentConceptSet() && this.currentConceptSet().name() && this.currentConceptSet().name().trim();
			});
			this.isNameCharactersValid = ko.computed(() => {
				return this.isNameFilled() && commonUtils.isNameCharactersValid(this.currentConceptSet().name());
			});
			this.isNameLengthValid = ko.computed(() => {
				return this.isNameFilled() && commonUtils.isNameLengthValid(this.currentConceptSet().name());
			});
			this.isDefaultName = ko.computed(() => {
				return this.isNameFilled() && this.currentConceptSet().name().trim() === this.defaultName;
			});
			this.isNameCorrect = ko.computed(() => {
				return this.isNameFilled() && !this.isDefaultName() && this.isNameCharactersValid() && this.isNameLengthValid();
			});
			this.canSave = ko.computed(() => {
				return (
					!this.loading()
					&& this.currentConceptSet() != null
					&& this.currentConceptSetDirtyFlag().isDirty()
					&& this.isNameCorrect()
					&& this.canEdit()
				);
			});
			this.canCreate = ko.computed(() => {
				return authApi.isPermittedCreateConceptset();
			});
			this.hasAccess = authApi.isPermittedReadConceptsets;
			this.hasPrioritySourceAccess = ko.observable(true);
			this.isAuthenticated = authApi.isAuthenticated;
			this.conceptSetCaption = ko.computed(() => {
				if (this.currentConceptSet()) {
					if (this.currentConceptSet().id === 0) {
						return globalConstants.newEntityNames.conceptSet();
					} else {
						return ko.i18nformat('cs.manager.caption', 'Concept Set #<%=id%>', {id: this.currentConceptSet().id})();
					}
				}
			});
			this.canDelete = ko.pureComputed(() => {
				if (!config.userAuthenticationEnabled) {
					return true;
				}
				return this.conceptSetStore.current() && authApi.isPermittedDeleteConceptset(this.conceptSetStore.current().id);
			});
			this.canOptimize = ko.computed(() => {
				return (
					this.currentConceptSet()
					&& this.currentConceptSet().id != 0
					&& this.currentConceptSet().expression.items().length > 1
					&& this.canCreate()
					&& this.canEdit()
				);
			});
			this.optimalConceptSet = ko.observable(null);
			this.optimizerRemovedConceptSet = ko.observable(null);
			this.optimizerSavingNew = ko.observable(false);
			this.optimizerSavingNewName = ko.observable();
			this.optimizerFoundSomething = ko.pureComputed(() => {
				var returnVal = false;
				if (this.optimalConceptSet() &&
					this.optimalConceptSet().length > 0 &&
					this.currentConceptSet() && this.currentConceptSet().expression.items() &&
					this.currentConceptSet().expression.items().length > 0) {
					returnVal = this.optimalConceptSet().length != this.currentConceptSet().expression.items().length;
				}
				return returnVal;
			});
			this.saveConceptSetShow = ko.observable(false);
			this.canCopy = ko.computed(() => {
				return this.currentConceptSet() && this.currentConceptSet().id > 0;
			});
			this.isSaving = ko.observable(false);
			this.isDeleting = ko.observable(false);
			this.isOptimizing = ko.observable(false);
			this.isProcessing = ko.computed(() => {
				return this.isSaving() || this.isDeleting() || this.isOptimizing();
			});
			this.optimizeTableOptions = commonUtils.getTableOptions('M');
			const tableOptions = commonUtils.getTableOptions('L');
			this.tabs = [
				{
					title: ko.i18n('cs.manager.tabs.conceptSetExpression', 'Concept Set Expression'),
					key: ViewMode.EXPRESSION,
					componentName: 'conceptset-expression',
					componentParams: {
						...params,
						tableOptions,
						canEditCurrentConceptSet: this.canEdit,
						conceptSetStore: this.conceptSetStore,
					},
				},
				{
					title: ko.i18n('cs.manager.tabs.includedConcepts', 'Included Concepts'),
					key: ViewMode.INCLUDED,
					componentName: 'conceptset-list-included',
					componentParams: {
						...params,
						tableOptions,
						canEdit: this.canEdit,
						currentConceptSet: this.conceptSetStore.current,
						conceptSetStore: this.conceptSetStore,
						loading: this.conceptSetStore.loadingIncluded,
						activeConceptSet: ko.observable(this.conceptSetStore),
					},
					hasBadge: true,
				},
				{
					title: ko.i18n('cs.manager.tabs.includedSourceCodes', 'Included Source Codes'),
					key: ViewMode.SOURCECODES,
					componentName: 'conceptset-list-included-sourcecodes',
					componentParams: {
						...params,
						tableOptions,
						canEdit: this.canEdit,
						conceptSetStore: this.conceptSetStore,
						loading: this.conceptSetStore.loadingSourceCodes},
						activeConceptSet: ko.observable(this.conceptSetStore),
				},
				{
					title: ko.i18n('cs.manager.tabs.exploreEvidence', 'Explore Evidence'),
					key: ViewMode.EXPLORE,
					componentName: 'explore-evidence',
					componentParams: {
						...params,
						saveConceptSet: this.saveConceptSet,
					},
				},
				{
					title: ko.i18n('cs.manager.tabs.export', 'Export'),
					key: ViewMode.EXPORT,
					componentName: 'conceptset-list-export',
					componentParams: {...params, canEdit: this.canEdit, conceptSetStore: this.conceptSetStore}
				},
				{
					title: ko.i18n('cs.manager.tabs.import', 'Import'),
					key: ViewMode.IMPORT,
					componentName: 'conceptset-list-import',
					componentParams: {
						...params,
						canEdit: this.canEdit,
						conceptSetStore: this.conceptSetStore,
						loadConceptSet: this.loadConceptSet,
						activeConceptSet: ko.observable(this.conceptSetStore),
					},
				},
				{
					title: ko.i18n('cs.manager.tabs.compare', 'Compare'),
					key: ViewMode.COMPARE,
					componentName: 'conceptset-compare',
					componentParams: {
						...params,
						saveConceptSetFn: this.saveConceptSet,
						saveConceptSetShow: this.saveConceptSetShow,
					},
				},
			];
			this.selectedTab = ko.observable(0);

			if (!sharedState.evidenceUrl()) {
				this.tabs = this.tabs.filter(tab => tab.key !== ViewMode.EXPLORE);
			}

			this.activeUtility = ko.observable("");

			GlobalPermissionService.decorateComponent(this, {
				entityTypeGetter: () => entityType.CONCEPT_SET,
				entityIdGetter: () => this.currentConceptSet() && this.currentConceptSet().id,
				createdByUsernameGetter: () => this.currentConceptSet() && this.currentConceptSet().createdBy
					&& this.currentConceptSet().createdBy.login
			});

			this.conceptSetStore.isEditable(this.canEdit());
			this.subscriptions.push(this.conceptSetStore.observer.subscribe(async () => {
				// when the conceptSetStore changes (either through a new concept set being loaded or changes to concept set options), the concept set resolves and the view is refreshed.
				// this must be done within the same subscription due to the asynchronous nature of the AJAX and UI interface (ie: user can switch tabs at any time)
				try {
					await this.conceptSetStore.resolveConceptSetExpression();
					await this.conceptSetStore.refresh(this.tabs[this.selectedTab() || 0].key);
				} catch (err) {
					if (err == RESOLVE_OUT_OF_ORDER)
						console.info(err);
					else
						throw(err);
				}
			}));

			// initially resolve the concept set
			this.conceptSetStore.resolveConceptSetExpression().then(() => this.conceptSetStore.refresh(this.tabs[this.selectedTab() || 0].key));
		}

		onRouterParamsChanged(params, newParams) {
			const {conceptSetId, mode} = Object.assign({}, params, newParams);
			this.changeMode(conceptSetId, mode);
			if (mode !== undefined) {
				this.selectedTab(this.getIndexByMode(mode));
			}
		}

		async changeMode(conceptSetId, mode) {
			if (conceptSetId !== undefined) {
				await this.loadConceptSet(conceptSetId);
			}
			await this.conceptSetStore.refresh(mode);
		}

		renderCheckbox(field, readonly = false) {
			return this.canEdit() && !readonly
				? `<span data-bind="click: d => $parent.toggleCheckbox(d, '${field}'), css: { selected: ${field} }" class="fa fa-check"></span>`
				: `<span data-bind="css: { selected: ${field}}" class="fa fa-check readonly"></span>`;
		}

		toggleCheckbox(d, field) {
			commonUtils.toggleConceptSetCheckbox(
				this.canEdit,
				this.optimalConceptSet,
				d,
				field,
			);
		}

		async loadConceptSet(conceptSetId) {
			this.loading(true);
			sharedState.activeConceptSet(this.conceptSetStore);
			if (conceptSetId === 0 && !this.currentConceptSet()) {
				conceptSetUtils.createRepositoryConceptSet(this.conceptSetStore);
				this.loading(false);
			}
			if ( this.currentConceptSet() && this.currentConceptSet().id === conceptSetId) {
				this.loading(false);
				return;
			}
			try {
				this.hasPrioritySourceAccess(true);
				const conceptSet = await conceptSetService.loadConceptSet(conceptSetId);
				const expression = await conceptSetService.loadConceptSetExpression(conceptSetId);
				conceptSet.expression = _.isEmpty(expression) ? {items: []} : expression;
				sharedState.RepositoryConceptSet.current({...conceptSet, ...(new ConceptSet(conceptSet))});
				this.conceptSetStore.current(sharedState.RepositoryConceptSet.current());
				this.conceptSetStore.isEditable(this.canEdit());
			} catch(err) {
				if (err.status === 403) {
					this.hasPrioritySourceAccess(false);
				}
			}
			this.loading(false);
		}

		dispose() {
			super.dispose();
			this.onConceptSetModeChanged && this.onConceptSetModeChanged.dispose();
			this.fade(false); // To close modal immediately, otherwise backdrop will freeze and remain at new page
			this.isOptimizeModalShown(false);
			this.conceptSetCaption.dispose();
		}

		async saveConceptSet(conceptSet, nameElementId) {
			this.isSaving(true);
			this.loading(true);
			let conceptSetName = conceptSet.name();
			conceptSet.name(conceptSetName.trim());
			// Next check to see that a concept set with this name does not already exist
			// in the database. Also pass the conceptSetId so we can make sure that the
			// current concept set is excluded in this check.
			const conceptSetItems = utils.toRepositoryConceptSetItems(conceptSet.expression.items());
			try{
				const results = await conceptSetService.exists(conceptSet.name(), conceptSet.id);
				if (results > 0) {
					this.raiseConceptSetNameProblem(ko.i18n('cs.manager.csAlreadyExistsMessage', 'A concept set with this name already exists. Please choose a different name.')(), nameElementId);
				} else {
					const savedConceptSet = await conceptSetService.saveConceptSet(conceptSet);
					await conceptSetService.saveConceptSetItems(savedConceptSet.data.id, conceptSetItems);
					this.loading(false);
					this.isSaving(false);
					commonUtils.routeTo('/conceptset/' + savedConceptSet.data.id + '/expression');
				}
			} catch (e) {
				alert(ko.i18n('cs.manager.csSaveErrorMessage', 'An error occurred while attempting to save a concept set.')());
			} finally {
				this.loading(false);
				this.isSaving(false);
			}
		}

		raiseConceptSetNameProblem(msg, elem) {
			alert(msg);
			$(elem).select().focus();
		}

		closeConceptSet() {
			if (this.currentConceptSetDirtyFlag().isDirty() &&
					!confirm(ko.unwrap(ko.i18n('cs.manager.csNotSavedConfirmMessage','Your concept set changes are not saved. Would you like to continue?')))) {
				return;
			} else {
				this.conceptSetStore.clear();
				if (this.conceptSetStore == sharedState.activeConceptSet()) {
					sharedState.activeConceptSet(null);
				}
				this.currentConceptSetDirtyFlag().reset();
				sharedState.RepositoryConceptSet.current(null);
				commonUtils.routeTo('/conceptsets');
			}
		}

		async save() {
			await this.saveConceptSet(this.currentConceptSet(), '#txtConceptSetName');
			this.currentConceptSetDirtyFlag().reset();
		}

		async copy() {
			const responseWithName = await conceptSetService.getCopyName(this.currentConceptSet().id);
			this.currentConceptSet().name(responseWithName.copyName);
			this.currentConceptSet().id = 0;
			this.currentConceptSetDirtyFlag().reset();
			this.saveConceptSet(this.currentConceptSet(), "#txtConceptSetName");
		}

		async optimize() {
			this.isOptimizing(true);
			this.activeUtility("optimize");
			this.optimizeLoading(true);
			this.optimalConceptSet(null);
			this.optimizerRemovedConceptSet(null);
			this.isOptimizeModalShown(true);

			let conceptSetItems = ko.toJS(this.conceptSetStore.current().expression);

			const optimizationResults = await vocabularyAPI.optimizeConceptSet(conceptSetItems)

			var optimizedConcepts = (optimizationResults.optimizedConceptSet.items || []).map(item => new ConceptSetItem(item));

			var removedConcepts = optimizationResults.removedConceptSet.items || [];

			this.optimalConceptSet(optimizedConcepts);
			this.optimizerRemovedConceptSet(removedConcepts);
			this.optimizeLoading(false);
			this.activeUtility("");
			this.isOptimizing(false);

		}

		delete() {
			if (!confirm(ko.unwrap(ko.i18n('cs.manager.csDeleteConfirmMessage','Delete concept set? Warning: deletion can not be undone!'))))
				return;

			this.isDeleting(true);
			// reset view after save
			conceptSetService.deleteConceptSet(this.currentConceptSet().id)
				.then(() => {
					this.currentConceptSetDirtyFlag().reset(); // so that we don't get a 'unsaved' warning when we close.
					this.closeConceptSet();
				});
		}

		getIndexByMode(mode = ViewMode.EXPRESSION) {
			let index = this.tabs
				.map(tab => tab.key)
				.indexOf(mode);
			if (index === -1) {
				index = 0;
			}

			return index;
		}

		getModeByTabIndex(idx) {
			return this.tabs[idx] ? this.tabs[idx].key : this.tabs[0].key;
		}

		selectTab(index) {
			const id = this.currentConceptSet()
				? this.currentConceptSet().id
				: 0;
			const mode = this.getModeByTabIndex(index);
			!!mode && commonUtils.routeTo(constants.paths.mode(id, mode));
		}

		async overwriteConceptSet() {
			this.currentConceptSet().expression.items(this.optimalConceptSet());
			this.isOptimizeModalShown(false);
		}

		copyOptimizedConceptSet () {
			this.optimizerSavingNewName(this.currentConceptSet().name() + " - OPTIMIZED");
			this.optimizerSavingNew(true);
		}

		async saveNewOptimizedConceptSet() {
			this.optimizerSavingNew(false);
			this.isOptimizeModalShown(false);
			const conceptSet = {
				id: 0,
				name: this.optimizerSavingNewName(),
				expression: {
					items: ko.toJS(this.optimalConceptSet())
				}
			};
			await this.saveConceptSet(new ConceptSet(conceptSet), "#txtOptimizerSavingNewName");
		}

		cancelSaveNewOptimizedConceptSet() {
			this.optimizerSavingNew(false);
		}

		getAuthorship() {
		   const createdDate = commonUtils.formatDateForAuthorship(this.currentConceptSet().createdDate);
		   const modifiedDate = commonUtils.formatDateForAuthorship(this.currentConceptSet().modifiedDate);
				return {
						createdBy: lodash.get(this.currentConceptSet(), 'createdBy.name'),
						createdDate,
						modifiedBy: lodash.get(this.currentConceptSet(), 'modifiedBy.name'),
						modifiedDate,
				}
		}

	}
	return commonUtils.build('conceptset-manager', ConceptsetManager, view);
});
