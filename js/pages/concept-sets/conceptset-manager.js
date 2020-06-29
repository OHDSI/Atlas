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
	'components/security/access/configure-access-modal'
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
	conceptSet,
	sharedState,
	conceptSetService,
	authApi,
) {
	class ConceptsetManager extends AutoBind(Page) {
		constructor(params) {
			super(params);
			this.componentParams = params;
			this.commonUtils = commonUtils;
			this.currentConceptSet = sharedState.repositoryConceptSet.current;
			this.currentConceptSetSource = sharedState.ConceptSet.source;
			this.currentConceptSetDirtyFlag = sharedState.repositoryConceptSet.dirtyFlag;
			this.currentConceptSetMode = sharedState.currentConceptSetMode;
			this.isOptimizeModalShown = ko.observable(false);
			this.selectedConcepts = sharedState.repositoryConceptSet.selectedConcepts;
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
			this.isNameCorrect = ko.computed(() => {
				return this.isNameFilled() && this.currentConceptSet().name() !== this.defaultName;
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
						return 'Concept Set #' + this.currentConceptSet().id;
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
					&& sharedState.repositoryConceptSet.selectedConcepts().length > 1
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
						componentName: 'conceptset-expression',
						componentParams: { ...params, canEditCurrentConceptSet: this.canEdit },
				},
				{
						title: 'Included Concepts',
						componentName: 'included-conceptsets',
						componentParams: { ...params, canEditCurrentConceptSet: this.canEdit },
						hasBadge: true,
				},
				{
						title: 'Included Source Codes',
						componentName: 'included-sourcecodes',
						componentParams:  { ...params, canEditCurrentConceptSet: this.canEdit },
				},
				{
						title: 'Explore Evidence',
						componentName: 'explore-evidence',
						componentParams: {
							...params,
							saveConceptSet: this.saveConceptSet,
						},
				},
				{
						title: 'Export',
						componentName: 'conceptset-export',
						componentParams: params,
				},
				{
						title: 'Compare',
						componentName: 'conceptset-compare',
						componentParams: {
							...params,
							saveConceptSetFn: this.saveConceptSet,
							saveConceptSetShow: this.saveConceptSetShow,
						},
				}
			];
			this.selectedTab = ko.observable(this.routerParams.mode);

			this.activeUtility = ko.observable("");

			GlobalPermissionService.decorateComponent(this, {
				entityTypeGetter: () => entityType.CONCEPT_SET,
				entityIdGetter: () => this.currentConceptSet() && this.currentConceptSet().id,
				createdByUsernameGetter: () => this.currentConceptSet() && this.currentConceptSet().createdBy
			});

			this.onConceptSetModeChanged = sharedState.currentConceptSetMode
				.subscribe(mode => conceptSetService.onCurrentConceptSetModeChanged({ mode, source: globalConstants.conceptSetSources.repository }));
			console.log(this);
		}

		onRouterParamsChanged(params, newParams) {
			const {conceptSetId, mode} = Object.assign({}, params, newParams);
			this.changeMode(conceptSetId, mode);
			if (mode !== undefined) {
				this.selectedTab(this.getIndexByComponentName(mode));
			}
		}

		async changeMode(conceptSetId, mode) {
			if (conceptSetId !== undefined) {
				await this.loadConceptSet(conceptSetId, mode);
			}
			this.currentConceptSetMode(mode);
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
			if (conceptSetId === 0 && !this.currentConceptSet()) {
				// Create a new concept set
				this.currentConceptSet({
					name: ko.observable('New Concept Set'),
					id: 0
				});
				this.loading(false);
			}
			if (
				this.currentConceptSet()
				&& this.currentConceptSet().id === conceptSetId
			) {
				this.currentConceptSetSource('repository');
				this.loading(false);
				return;
			}
			try {
				const conceptset = await conceptSetService.loadConceptSet(conceptSetId);
				const data = await conceptSetService.loadConceptSetExpression(conceptSetId);
				const expression = _.isEmpty(data) ? { items: [] } : data;
				conceptSetService.setConceptSet(conceptset, expression.items, globalConstants.conceptSetSources.repository);
				await conceptSetService.resolveConceptSetExpression({ source: globalConstants.conceptSetSources.repository });
				// this.currentConceptSetSource('repository');
			} catch(err) {
				console.error(err);
				sharedState.repositoryConceptSet.resolvingConceptSetExpression(false);
			}
			this.loading(false);
		}

		dispose() {
			this.onConceptSetModeChanged && this.onConceptSetModeChanged.dispose();
			this.onSelectedConceptsChanged && this.onSelectedConceptsChanged.dispose();
			this.fade(false); // To close modal immediately, otherwise backdrop will freeze and remain at new page
			this.isOptimizeModalShown(false);
			this.conceptSetCaption.dispose();
			sharedState.includedHash(null);
		}

		saveClick() {
			this.saveConceptSet("#txtConceptSetName");
		}

		async saveConceptSet(txtElem, conceptSet, selectedConcepts) {
			this.isSaving(true);
			this.loading(true);
			if (conceptSet === undefined) {
				conceptSet = {};
				if (this.currentConceptSet() == undefined) {
					conceptSet.id = 0;
					conceptSet.name = this.conceptSetName;
				} else {
					conceptSet = this.currentConceptSet();
				}
			}
			if (selectedConcepts === undefined) {
				selectedConcepts = this.selectedConcepts();
			}

			// Next check to see that a concept set with this name does not already exist
			// in the database. Also pass the conceptSetId so we can make sure that the
			// current concept set is excluded in this check.
			try{
				const results = await conceptSetService.exists(conceptSet.name(), conceptSet.id);
				if (results > 0) {
					this.raiseConceptSetNameProblem('A concept set with this name already exists. Please choose a different name.', txtElem);
				} else {
					const conceptSetItems = utils.toConceptSetItems(selectedConcepts);
					try{
						const savedConceptSet = await conceptSetService.saveConceptSet(conceptSet);
						await conceptSetService.saveConceptSetItems(savedConceptSet.data.id, conceptSetItems);
						await conceptSetService.resolveConceptSetExpression({ source: globalConstants.conceptSetSources.repository });
						//order of setting 'dirtyFlag' and 'loading' affects correct behaviour of 'canSave' (it prevents duplicates)
						this.currentConceptSetDirtyFlag().reset();
						commonUtils.routeTo('/conceptset/' + savedConceptSet.data.id + '/details');
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
			if (this.currentConceptSet()) {
				this.currentConceptSet().name.valueHasMutated();
			}
			alert(msg);
			$(elem)
				.select()
				.focus();
		}

		closeConceptSet() {
			if (this.currentConceptSetDirtyFlag().isDirty() && !confirm("Your concept set changes are not saved. Would you like to continue?")) {
				return;
			} else {
				conceptSetService.clearConceptSet({ source: globalConstants.conceptSetSources.repository });
				document.location = "#/conceptsets";
			}
		}

		async copy() {
			const responseWithName = await conceptSetService.getCopyName(this.currentConceptSet().id);
			this.conceptSetName(responseWithName.copyName);
			this.currentConceptSet(undefined);
			this.saveConceptSet("#txtConceptSetName");
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
						optimizedConcepts.push(conceptSetService.enhanceConceptSet(item));
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

		getIndexByComponentName(name = 'conceptset-expression') {
			let index = this.tabs
				.map(tab => tab.componentName)
				.indexOf(name);
			if (index === -1) {
				index = 0;
			}

			return index;
		}

		getComponentNameByTabIndex(idx) {
			return this.tabs[idx] ? this.tabs[idx].componentName : this.tabs[0].componentName;
		}

		selectTab(index) {
			const id = this.currentConceptSet()
				? this.currentConceptSet().id
				: 0;
			const mode = this.getComponentNameByTabIndex(index);
			!!mode && commonUtils.routeTo(constants.paths.mode(id, mode));
		}

		async overwriteConceptSet() {
			sharedState.clearSelectedConcepts({ source: globalConstants.conceptSetSources.repository });
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

	}
	return commonUtils.build('conceptset-manager', ConceptsetManager, view);
});
