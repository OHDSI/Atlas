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
	'./components/tabs/included-conceptsets',
	'./components/tabs/included-sourcecodes',
	'./components/tabs/explore-evidence',
	'./components/tabs/conceptset-export',
	'./components/tabs/conceptset-compare',
	'components/security/access/configure-access-modal',
	'components/authorship',
	'components/name-validation',
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
    lodash,
) {
	class ConceptsetManager extends AutoBind(Page) {
		constructor(params) {
			super(params);
			this.componentParams = params;
			this.commonUtils = commonUtils;
			this.currentConceptSet = sharedState.ConceptSet.current;
			this.currentConceptSetSource = sharedState.ConceptSet.source;
			this.currentConceptSetDirtyFlag = sharedState.ConceptSet.dirtyFlag;
			this.currentConceptSetMode = sharedState.currentConceptSetMode;
			this.isOptimizeModalShown = ko.observable(false);
			this.selectedConcepts = sharedState.selectedConcepts;
			this.defaultName = ko.unwrap(globalConstants.newEntityNames.conceptSet);
			this.conceptSetName = ko.observable(this.defaultName);
			this.loading = ko.observable();
			this.optimizeLoading = ko.observable();
			this.fade = ko.observable(true);

      // switches default name according to current locale
			sharedState.localeSettings.subscribe((localeSettings) => {
				if (this.currentConceptSet() && (this.currentConceptSet().name() === this.defaultName)) {
					let name = localeSettings.const.newEntityNames.conceptSet;
					this.currentConceptSet().name(name);
					this.defaultName = name;
				}
			});

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
						return globalConstants.newEntityNames.conceptSet();
					} else {
						return ko.i18nformat('cs.manager.caption', 'Concept Set #<%=id%>', {id: this.currentConceptSet().id})();
					}
				}
			});
			this.canDelete = ko.pureComputed(() => {
				if (!config.userAuthenticationEnabled)
					return true;

				if (this.currentConceptSetSource() == 'repository') {
					return sharedState.ConceptSet.current() && authApi.isPermittedDeleteConceptset(sharedState.ConceptSet.current().id);
				} else {
					return false;
				}
			});
			this.canOptimize = ko.computed(() => {
				return (
					this.currentConceptSet()
					&& this.currentConceptSet().id != 0
					&& sharedState.selectedConcepts().length > 1
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
						title: ko.i18n('cs.manager.tabs.conceptSetExpression', 'Concept Set Expression'),
						componentName: 'conceptset-expression',
						componentParams: { ...params, canEditCurrentConceptSet: this.canEdit },
				},
				{
						title: ko.i18n('cs.manager.tabs.includedConcepts', 'Included Concepts'),
						componentName: 'included-conceptsets',
						componentParams: { ...params, canEditCurrentConceptSet: this.canEdit },
						hasBadge: true,
				},
				{
						title: ko.i18n('cs.manager.tabs.includedSourceCodes', 'Included Source Codes'),
						componentName: 'included-sourcecodes',
						componentParams:  { ...params, canEditCurrentConceptSet: this.canEdit },
				},
				{
						title: ko.i18n('cs.manager.tabs.exploreEvidence', 'Explore Evidence'),
						componentName: 'explore-evidence',
						componentParams: {
							...params,
							saveConceptSet: this.saveConceptSet,
						},
				},
				{
						title: ko.i18n('cs.manager.tabs.export', 'Export'),
						componentName: 'conceptset-export',
						componentParams: params,
				},
				{
						title: ko.i18n('cs.manager.tabs.compare', 'Compare'),
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

			this.onConceptSetModeChanged = sharedState.currentConceptSetMode.subscribe(conceptSetService.onCurrentConceptSetModeChanged);
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
					name: ko.observable(ko.unwrap(globalConstants.newEntityNames.conceptSet)),
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
				conceptSetService.setConceptSet(conceptset, expression.items);
				await conceptSetService.resolveConceptSetExpression();
				this.currentConceptSetSource('repository');
			} catch(err) {
				console.error(err);
				sharedState.resolvingConceptSetExpression(false);
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
					this.raiseConceptSetNameProblem(ko.i18n('cs.manager.csAlreadyExistsMessage', 'A concept set with this name already exists. Please choose a different name.')(), txtElem);
				} else {
					const conceptSetItems = utils.toConceptSetItems(selectedConcepts);
					try{
						const savedConceptSet = await conceptSetService.saveConceptSet(conceptSet);
						await conceptSetService.saveConceptSetItems(savedConceptSet.data.id, conceptSetItems);
						await conceptSetService.resolveConceptSetExpression();
						//order of setting 'dirtyFlag' and 'loading' affects correct behaviour of 'canSave' (it prevents duplicates)
						this.currentConceptSetDirtyFlag().reset();
						commonUtils.routeTo('/conceptset/' + savedConceptSet.data.id + '/details');
					} catch(e){
						alert(ko.unwrap(ko.i18n('cs.manager.csUnableToSaveMessage', 'Unable to save concept set')));
					}
				}
			} catch (e) {
				alert(ko.unwrap(ko.i18n('cs.manager.csSaveErrorMessage', 'An error occurred while attempting to save a concept set.')));
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
			if (this.currentConceptSetDirtyFlag().isDirty() &&
					!confirm(ko.unwrap(ko.i18n('cs.manager.csNotSavedConfirmMessage','Your concept set changes are not saved. Would you like to continue?')))) {
				return;
			} else {
				conceptSetService.clearConceptSet();
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
					includeMapped: +item.includeMapped()
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
			if (!confirm(ko.unwrap(ko.i18n('cs.manager.csDeleteConfirmMessage','Delete concept set? Warning: deletion can not be undone!'))))
				return;

			this.isDeleting(true);
			// reset view after save
			conceptSetService.deleteConceptSet(this.currentConceptSet().id)
				.then(() => {
					conceptSetService.clearConceptSet();
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
			sharedState.clearSelectedConcepts();
			const newConceptSet = this.optimalConceptSet().map((item) => {
				sharedState.selectedConceptsIndex[item.concept.CONCEPT_ID] = 1;
				return item;
			});
			sharedState.selectedConcepts(newConceptSet);
			this.isOptimizeModalShown(false);
			sharedState.includedConcepts.valueHasMutated();
			sharedState.includedSourcecodes.valueHasMutated();
			await conceptSetService.resolveConceptSetExpression();
			await conceptSetService.onCurrentConceptSetModeChanged(sharedState.currentConceptSetMode());
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
						createdBy: lodash.get(this.currentConceptSet(), 'createdBy.name'),
						createdDate,
						modifiedBy: lodash.get(this.currentConceptSet(), 'modifiedBy.name'),
						modifiedDate,
				}
		}
	}
	return commonUtils.build('conceptset-manager', ConceptsetManager, view);
});
