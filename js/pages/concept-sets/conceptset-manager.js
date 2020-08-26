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
	'atlas-state',
	'services/ConceptSet',
	'components/conceptset/ConceptSetStore',
	'components/conceptset/utils',
	'services/AuthAPI',
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
	'./components/tabs/included-conceptsets',
	'./components/tabs/included-sourcecodes',
	'./components/tabs/explore-evidence',
	'./components/tabs/conceptset-export',
	'./components/tabs/conceptset-compare',
	'./components/tabs/conceptset-import',
	'components/security/access/configure-access-modal',
	'components/authorship',
	'components/name-validation',
  'components/conceptset/conceptset-list/included'
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
	sharedState,
	conceptSetService,
	ConceptSetStore,
	conceptSetUtils,
	authApi,
) {
  
  const {ViewMode, RESOLVE_OUT_OF_ORER} = constants;
  
	class ConceptsetManager extends AutoBind(Page) {
		constructor(params) {
			super(params);
			this.commonUtils = commonUtils;
			this.conceptSetStore = ConceptSetStore.repository();
			this.currentConceptSet = ko.pureComputed(() => this.conceptSetStore.current());
			this.currentConceptSetDirtyFlag = sharedState.RepositoryConceptSet.dirtyFlag;
			this.currentConceptSetMode = sharedState.currentConceptSetMode;
			this.isOptimizeModalShown = ko.observable(false);
			this.defaultName = globalConstants.newEntityNames.conceptSet;
			this.conceptSetName = ko.observable(this.defaultName);
			this.loading = ko.observable();
			this.optimizeLoading = ko.observable();
			this.fade = ko.observable(true);

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
				return this.currentConceptSet() && this.currentConceptSet().name();
			});
			this.isNameCharactersValid = ko.computed(() => {
				return this.isNameFilled() && commonUtils.isNameCharactersValid(this.currentConceptSet().name());
			});
			this.isNameLengthValid = ko.computed(() => {
				return this.isNameFilled() && commonUtils.isNameLengthValid(this.currentConceptSet().name());
			});
			this.isDefaultName = ko.computed(() => {
				return this.isNameFilled() && this.currentConceptSet().name() === this.defaultName;
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
				);
			});
			this.canCreate = ko.computed(() => {
				return authApi.isPermittedCreateConceptset();
			});
			this.hasAccess = authApi.isPermittedReadConceptsets;
			this.isAuthenticated = authApi.isAuthenticated;
			this.conceptSetCaption = ko.computed(() => {
				if (this.currentConceptSet()) {
					if (this.currentConceptSet().id === 0) {
						return this.defaultName;
					} else {
						return `Concept Set #${this.currentConceptSet().id}`;
					}
				}
			});
			this.canDelete = ko.pureComputed(() => {
				if (!config.userAuthenticationEnabled)
					return true;

				if (this.currentConceptSetSource() == 'repository') {
					return sharedState.repositoryConceptSet.current() && authApi.isPermittedDeleteConceptset(sharedState.repositoryConceptSet.current().id);
				} else {
					return false;
				}
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
					this.selectedConcepts() &&
					this.selectedConcepts().length > 0) {
					returnVal = this.optimalConceptSet().length != this.selectedConcepts().length;
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
			this.tabs = [
				{
          title: 'Concept Set Expression',
          key: ViewMode.EXPRESSION,
          componentName: 'conceptset-expression',
          componentParams: { ...params, 
                            canEditCurrentConceptSet: this.canEdit, 
                            conceptSetStore: this.conceptSetStore},
				},
				{
          title: 'Included Concepts',
          key: ViewMode.INCLUDED,
          //componentName: 'included-conceptsets',
          componentName: 'conceptset-list-included',
          componentParams: { ...params, canEdit: this.canEdit,
														currentConceptSet: this.conceptSetStore.current,
                            conceptSetStore: this.conceptSetStore,
                            loading: this.conceptSetStore.loadingIncluded,
                           },
          hasBadge: true,
				},
				{
          title: 'Included Source Codes',
          key: ViewMode.SOURCECODES,
          componentName: 'conceptset-list-included-sourcecodes',
          componentParams:  { ...params, canEdit: this.canEdit,
														 conceptSetStore: this.conceptSetStore,
														 loading: this.conceptSetStore.loadingSourceCodes},
				},
				{
          title: 'Explore Evidence',
          key: ViewMode.EXPLORE,
          componentName: 'explore-evidence',
          componentParams: {
            ...params,
            saveConceptSet: this.saveConceptSet,
          },
				},
				{
          title: 'Export',
          key: ViewMode.EXPORT,
          componentName: 'conceptset-list-export',
          componentParams: {...params, canEdit: this.canEdit, conceptSetStore: this.conceptSetStore}
				},
				{
					title: 'Import',
          key: ViewMode.IMPORT,
					componentName: 'conceptset-list-import',
					componentParams: { 
						...params,
						canEdit: this.canEdit,
						conceptSetStore: this.conceptSetStore,
						loadConceptSet: this.loadConceptSet,
					},
				},
				{
          title: 'Compare',
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

			this.activeUtility = ko.observable("");

			GlobalPermissionService.decorateComponent(this, {
				entityTypeGetter: () => entityType.CONCEPT_SET,
				entityIdGetter: () => this.currentConceptSet() && this.currentConceptSet().id,
				createdByUsernameGetter: () => this.currentConceptSet() && this.currentConceptSet().createdBy
			});

			// watch for any change to expression items (observer has a delay)
      this.subscriptions.push(this.conceptSetStore.observer.subscribe(async () => {
				try {
					await this.conceptSetStore.resolveConceptSetExpression();
					await this.conceptSetStore.refresh(this.tabs[this.selectedTab()||0].key);
				} catch (err) {
					if (err != RESOLVE_OUT_OF_ORER)
						console.info(err);
					else
						throw(err);
				} finally {
				}
			}));      
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
				await this.conceptSetStore.refresh(mode);
			}
			//this.currentConceptSetMode(mode);
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

		createConceptSet() {
			conceptSetutils.createRepositoryConceptSet(this.conceptSetStore);
			this.loading(false);
		}
		
		async loadConceptSet(conceptSetId) {
			this.loading(true);
			if (conceptSetId === 0 && !this.currentConceptSet()) {
				this.createConceptSet();
				this.loading(false);
			}
			if ( this.currentConceptSet() && this.currentConceptSet().id === conceptSetId) {
				this.loading(false);
				return;
			}
			try {
				const conceptSet = await conceptSetService.loadConceptSet(conceptSetId);
				const expression = await conceptSetService.loadConceptSetExpression(conceptSetId);
				conceptSet.expression = _.isEmpty(expression) ? {items: []} : expression;
				sharedState.RepositoryConceptSet.current({...conceptSet, ...(new ConceptSet(conceptSet))});
				this.conceptSetStore.current(sharedState.RepositoryConceptSet.current());
				sharedState.activeConceptSet(this.conceptSetStore);
			} catch(err) {
				console.error(err);
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

		async saveConceptSet() {
			this.isSaving(true);
			this.loading(true);
			// Next check to see that a concept set with this name does not already exist
			// in the database. Also pass the conceptSetId so we can make sure that the
			// current concept set is excluded in this check.
			const conceptSet = this.currentConceptSet();
			const conceptSetItems = utils.toRepositoryConceptSetItems(conceptSet.expression.items());
			try{
				const results = await conceptSetService.exists(conceptSet.name(), conceptSet.id);
				if (results > 0) {
					this.raiseConceptSetNameProblem('A concept set with this name already exists. Please choose a different name.', "#txtConceptSetName");
				} else {
					try{
						const savedConceptSet = await conceptSetService.saveConceptSet(conceptSet);
						await conceptSetService.saveConceptSetItems(savedConceptSet.data.id, conceptSetItems);
						this.currentConceptSetDirtyFlag().reset();
						commonUtils.routeTo('/conceptset/' + savedConceptSet.data.id + '/expression');
					} catch(e){
						alert('Unable to save concept set');
					}
				}
			} catch (e) {
				alert('An error occurred while attempting to save a concept set.');
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
			if (this.currentConceptSetDirtyFlag().isDirty() && !confirm("Your concept set changes are not saved. Would you like to continue?")) {
				return;
			} else {
				this.conceptSetStore.clear();
				sharedState.RepositoryConceptSet.current(null);
				commonUtils.routeTo('/conceptsets');
			}
		}

		async copy() {
			const responseWithName = await conceptSetService.getCopyName(this.currentConceptSet().id);
			this.currentConceptSet.name(responseWithName.copyName);
			this.currentConceptSet().id = 0;
			this.saveConceptSet();
		}

		optimize() {
			this.isOptimizing(true);
			this.activeUtility("optimize");
			this.optimizeLoading(true);
			this.optimalConceptSet(null);
			this.optimizerRemovedConceptSet(null);
			this.isOptimizeModalShown(true);

			let conceptSetItems = [];

			for (var i = 0; i < this.selectedConcepts().length; i++) {
				var item = this.selectedConcepts()[i];
				conceptSetItems.push({
					concept: item.concept,
					isExcluded: +item.isExcluded(),
					includeDescendants: +item.includeDescendants(),
					includeMapped: +item.includeMapped(),
				});
			}

			conceptSetItems = {
				items: conceptSetItems
			}

			vocabularyAPI.optimizeConceptSet(conceptSetItems)
				.then((optimizationResults) => {
					var optimizedConcepts = [];
					optimizationResults.optimizedConceptSet.items.forEach((item) => {
						optimizedConcepts.push(conceptSetService.enhanceConceptSetItem(item));
					});
					var removedConcepts = [];
					optimizationResults.removedConceptSet.items.forEach((item) => {
						removedConcepts.push(item);
					});
					this.optimalConceptSet(optimizedConcepts);
					this.optimizerRemovedConceptSet(removedConcepts);
					this.optimizeLoading(false);
					this.activeUtility("");
					this.isOptimizing(false);
				});
		}

		delete() {
			if (!confirm("Delete concept set? Warning: deletion can not be undone!"))
				return;

			this.isDeleting(true);
			// reset view after save
			conceptSetService.deleteConceptSet(this.currentConceptSet().id)
				.then(() => {
					conceptSetService.clearConceptSet({ source: globalConstants.conceptSetSources.repository });
					document.location = "#/conceptsets"
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
			const newConceptSet = this.optimalConceptSet().map((item) => {
				sharedState.repositoryConceptSet.selectedConceptsIndex[item.concept.CONCEPT_ID] = {
					isExcluded: ko.observable(!!item.isExcluded),
					includeDescendants: ko.observable(!!item.isExcluded),
					includeMapped: ko.observable(!!item.includeMapped),
				};
				return item;
			});
			sharedState.repositoryConceptSet.selectedConcepts(newConceptSet);
			this.isOptimizeModalShown(false);
			sharedState.repositoryConceptSet.includedConcepts.valueHasMutated();
			sharedState.repositoryConceptSet.includedSourcecodes.valueHasMutated();
			await conceptSetService.resolveConceptSetExpression({ source: globalConstants.conceptSetSources.repository });
			await conceptSetService.onCurrentConceptSetModeChanged({
				mode: sharedState.currentConceptSetMode(),
				source: globalConstants.conceptSetSources.repository,
			});
		}

		copyOptimizedConceptSet () {
			if (this.currentConceptSet() == undefined) {
				this.optimizerSavingNewName(this.conceptSetName());
			} else {
				this.optimizerSavingNewName(this.currentConceptSet().name() + " - OPTIMIZED");
			}
			this.optimizerSavingNew(true);
		}

		saveNewOptimizedConceptSet() {
			const conceptSet = {
				id: 0,
				name: this.optimizerSavingNewName,
			};
			this.saveConceptSet("#txtOptimizerSavingNewName", conceptSet, this.optimalConceptSet());
			this.optimizerSavingNew(false);
			this.isOptimizeModalShown(false);
		}

		cancelSaveNewOptimizedConceptSet() {
			this.optimizerSavingNew(false);
		}

	 getAuthorship() {
		const createdDate = commonUtils.formatDateForAuthorship(this.currentConceptSet().createdDate);
		const modifiedDate = commonUtils.formatDateForAuthorship(this.currentConceptSet().modifiedDate);
			 return {
					 createdBy: this.currentConceptSet().createdBy,
					 createdDate,
					 modifiedBy: this.currentConceptSet().modifiedBy,
					 modifiedDate,
			 }
	 }

	}
	return commonUtils.build('conceptset-manager', ConceptsetManager, view);
});
