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
	conceptSet,
	sharedState,
	conceptSetService,
	authApi
) {
	class ConceptsetManager extends AutoBind(Page) {
		constructor(params) {
			super(params);
			this.componentParams = params;
			this.model = params.model;
			this.currentConceptSet = this.model.currentConceptSet;
			this.isOptimizeModalShown = ko.observable(false);
			this.selectedConcepts = sharedState.selectedConcepts;
			this.defaultName = globalConstants.newEntityNames.conceptSet;
			this.conceptSetName = ko.observable(this.defaultName);
			this.loading = ko.observable();
			this.fade = ko.observable(true);
			this.canEdit = this.model.canEditCurrentConceptSet;
			this.isNameFilled = ko.computed(() => {
				return this.currentConceptSet() && this.currentConceptSet().name();
			});
			this.isNameCorrect = ko.computed(() => {
				return this.isNameFilled() && this.currentConceptSet().name() !== this.defaultName;
			});
			this.canSave = ko.computed(() => {
				return (
					!this.loading()
					&& this.model.currentConceptSet() != null
					&& this.model.currentConceptSetDirtyFlag().isDirty()
					&& this.isNameCorrect()
				);
			});
			this.canCreate = ko.computed(() => {
				return authApi.isPermittedCreateConceptset();
			});
			this.hasAccess = authApi.isPermittedReadConceptsets;
			this.isAuthenticated = authApi.isAuthenticated;
			this.conceptSetCaption = ko.computed(() => {
				if (this.model.currentConceptSet()) {
					if (this.model.currentConceptSet().id === 0) {
						return this.defaultName;
					} else {
						return 'Concept Set #' + this.model.currentConceptSet().id;
					}
				}
			});
			this.canDelete = this.model.canDeleteCurrentConceptSet;
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
						title: 'Concept Set Expression',
						componentName: 'conceptset-expression',
						componentParams: params,
				},
				{
						title: 'Included Concepts',
						componentName: 'included-conceptsets',
						componentParams: params,
						hasBadge: true,
				},
				{
						title: 'Included Source Codes',
						componentName: 'included-sourcecodes',
						componentParams: params,
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
		}

		onRouterParamsChanged({ conceptSetId, mode }) {
			if (conceptSetId !== undefined) {
				this.model.currentConceptSetMode('conceptset-expression');
			}
			if (mode !== undefined) {
				this.selectedTab(this.getIndexByComponentName(mode));
			}
		}

		dispose() {
			this.fade(false); // To close modal immediately, otherwise backdrop will freeze and remain at new page
			this.isOptimizeModalShown(false);
			this.conceptSetCaption.dispose();
		}

		saveClick() {
			this.saveConceptSet("#txtConceptSetName");
		}

		async saveConceptSet(txtElem, conceptSet, selectedConcepts) {
			this.isSaving(true);
			this.loading(true);
			if (conceptSet === undefined) {
				conceptSet = {};
				if (this.model.currentConceptSet() == undefined) {
					conceptSet.id = 0;
					conceptSet.name = this.conceptSetName;
				} else {
					conceptSet = this.model.currentConceptSet();
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
						await this.model.resolveConceptSetExpression();
						//order of setting 'dirtyFlag' and 'loading' affects correct behaviour of 'canSave' (it prevents duplicates)
						this.model.currentConceptSetDirtyFlag().reset();
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
			if (this.model.currentConceptSet()) {
				this.model.currentConceptSet().name.valueHasMutated();
			}
			alert(msg);
			$(elem)
				.select()
				.focus();
		}

		closeConceptSet() {
			if (this.model.currentConceptSetDirtyFlag().isDirty() && !confirm("Your concept set changes are not saved. Would you like to continue?")) {
				return;
			} else {
				this.model.clearConceptSet();
				document.location = "#/conceptsets";
			}
		}

		async copy() {
			const responseWithName = await conceptSetService.getCopyName(this.model.currentConceptSet().id);
			this.conceptSetName(responseWithName.copyName);
			this.model.currentConceptSet(undefined);
			this.saveConceptSet("#txtConceptSetName");
		}

		optimize() {
			this.isOptimizing(true);
			this.activeUtility("optimize");
			this.loading(true);
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
						optimizedConcepts.push(item);
					});
					var removedConcepts = [];
					optimizationResults.removedConceptSet.items.forEach((item) => {
						removedConcepts.push(item);
					});
					this.optimalConceptSet(optimizedConcepts);
					this.optimizerRemovedConceptSet(removedConcepts);
					this.loading(false);
					this.activeUtility("");
					this.isOptimizing(false);
				});
		}

		delete() {
			if (!confirm("Delete concept set? Warning: deletion can not be undone!"))
				return;

			this.isDeleting(true);
			// reset view after save
			conceptSetService.deleteConceptSet(this.model.currentConceptSet().id)
				.then(() => {
					this.model.clearConceptSet();
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
			const id = this.model.currentConceptSet()
				? this.model.currentConceptSet().id
				: 0;
			const mode = this.getComponentNameByTabIndex(index);
			!!mode && commonUtils.routeTo(constants.paths.mode(id, mode));
		}

		overwriteConceptSet() {
			sharedState.clearSelectedConcepts();
			const newConceptSet = this.optimalConceptSet().map((item) => {
				sharedState.selectedConceptsIndex[item.concept.CONCEPT_ID] = 1;
				return conceptSetService.enhanceConceptSet(item);
			});
			sharedState.selectedConcepts(newConceptSet);
			this.isOptimizeModalShown(false);
		}

		copyOptimizedConceptSet () {
			if (this.model.currentConceptSet() == undefined) {
				this.optimizerSavingNewName(this.conceptSetName());
			} else {
				this.optimizerSavingNewName(this.model.currentConceptSet().name() + " - OPTIMIZED");
			}
			this.optimizerSavingNew(true);
		}

		saveNewOptimizedConceptSet() {
			const conceptSet = {
				id: 0,
				name: this.optimizerSavingNewName,
			};
			const selectedConcepts = this.optimalConceptSet().map((item) => (
				{
					concept: item.concept,
					isExcluded: ko.observable(item.isExcluded),
					includeDescendants: ko.observable(item.includeDescendants),
					includeMapped: ko.observable(item.includeMapped),
				}
			));
			this.saveConceptSet("#txtOptimizerSavingNewName", conceptSet, selectedConcepts);
			this.optimizerSavingNew(false);
			this.isOptimizeModalShown(false);
		}

		cancelSaveNewOptimizedConceptSet() {
			this.optimizerSavingNew(false);
		}

	}
	return commonUtils.build('conceptset-manager', ConceptsetManager, view);
});
