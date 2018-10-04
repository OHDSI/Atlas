define([
	'knockout',
	'text!./conceptset-manager.html',
	'providers/Page',
	'providers/AutoBind',
	'utils/CommonUtils',
	'appConfig',
	'./const',
	'components/conceptset/utils',
	'providers/Vocabulary',
	'conceptsetbuilder/InputTypes/ConceptSet',
	'atlas-state',
	'services/ConceptSet',
	'webapi/AuthAPI',
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
			this.isOptimizeModalShown = ko.observable(false);
			this.selectedConcepts = sharedState.selectedConcepts;
			this.conceptSetName = ko.observable("New Concept Set");
			this.canEdit = this.model.canEditCurrentConceptSet;
			this.canSave = ko.computed(() => {
				return (
					this.model.currentConceptSet() != null
					&& this.model.currentConceptSetDirtyFlag().isDirty()
				);
			});
			this.canCreate = ko.computed(() => {
				return authApi.isPermittedCreateConceptset();
			});
			this.canDelete = this.model.canDeleteCurrentConceptSet;
			this.loading = ko.observable();
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
		
		saveClick() {
			this.saveConceptSet("#txtConceptSetName");
		}

		saveConceptSet(txtElem, conceptSet, selectedConcepts) {
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
			var abortSave = false;

			// Do not allow someone to save a concept set with the default name of "New Concept Set
			if (conceptSet && conceptSet.name() === this.defaultConceptSetName) {
				this.raiseConceptSetNameProblem('Please provide a different name for your concept set', txtElem);
				return;
			}

			// Next check to see that a concept set with this name does not already exist
			// in the database. Also pass the conceptSetId so we can make sure that the
			// current concept set is excluded in this check.
			conceptSetService.exists(conceptSet.name, conceptSet.id)
				.then((results) => {
          if (results.length > 0) {
            this.raiseConceptSetNameProblem('A concept set with this name already exists. Please choose a different name.', txtElem);
            abortSave = true;
          }
				}, function(){
          alert('An error occurred while attempting to find a concept set with the name you provided.');
				})
				.then(() => {
					if (abortSave) {
						return;
					}

					var conceptSetItems = utils.toConceptSetItems(selectedConcepts);
					var conceptSetId;
					var itemsPromise = function({ data }) {
						conceptSetId = data.id;
						return conceptSetService.saveConceptSetItems(data.id, conceptSetItems);
					};
					conceptSetService.saveConceptSet(conceptSet)
						.then(itemsPromise)
						.then(() => {
              document.location = '#/conceptset/' + conceptSetId + '/details';
              this.model.currentConceptSetDirtyFlag().reset();
						})
						.catch(() => {
							alert('Unable to save concept set');
						});
				});
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

		copy() {
			this.conceptSetName("COPY OF: " + this.model.currentConceptSet().name());
			this.model.currentConceptSet(undefined);
			this.saveConceptSet("#txtConceptSetName");
		}

		optimize() {
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
				});
		}

		delete() {
			if (!confirm("Delete concept set? Warning: deletion can not be undone!"))
				return;

			// reset view after save
			conceptSetService.deleteConceptSet(this.model.currentConceptSet().id)
				.then(() => {
					this.model.currentConceptSet(null);
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
			document.location = constants.paths.mode(id, mode);
		}
		
		overwriteConceptSet() {
			var newConceptSet = [];
			this.optimalConceptSet().forEach((item) => {
				var newItem;
				newItem = {
					concept: item.concept,
					isExcluded: ko.observable(item.isExcluded),
					includeDescendants: ko.observable(item.includeDescendants),
					includeMapped: ko.observable(item.includeMapped),
				}
				newConceptSet.push(newItem);
			})
			this.selectedConcepts(newConceptSet);
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
			var conceptSet = {};
			conceptSet.id = 0;
			conceptSet.name = this.optimizerSavingNewName;
			var selectedConcepts = [];
			this.optimalConceptSet().forEach((item) => {
				var newItem;
				newItem = {
					concept: item.concept,
					isExcluded: ko.observable(item.isExcluded),
					includeDescendants: ko.observable(item.includeDescendants),
					includeMapped: ko.observable(item.includeMapped),
				}
				selectedConcepts.push(newItem);
			});
			this.saveConceptSet("#txtOptimizerSavingNewName", conceptSet, selectedConcepts);
			this.optimizerSavingNew(false);
		}

		cancelSaveNewOptimizedConceptSet() {
			this.optimizerSavingNew(false);
		}

	}
	return commonUtils.build('conceptset-manager', ConceptsetManager, view);
});
