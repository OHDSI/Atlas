define([
	'knockout',
	'text!./conceptset-manager.html',
	'providers/Component',
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
	'./components/tabs/conceptset-expression',
	'./components/tabs/included-conceptsets',
	'./components/tabs/included-sourcecodes',
	'./components/tabs/explore-evidence',
	'./components/tabs/conceptset-export',
	'./components/tabs/conceptset-compare',
], function (
	ko,
	view,
	Component,
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
	class ConceptsetManager extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.componentParams = params;			
			this.model = params.model;
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
			this.selectedTab = ko.pureComputed(() => {
				return this.getIndexByComponentName(params.mode);
			});
			this.activeUtility = ko.observable("");
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
			$('#modalConceptSetOptimize')
				.modal('show');

			var conceptSetItems = [];

			for (var i = 0; i < this.selectedConcepts()
				.length; i++) {
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
					_.each(optimizationResults.optimizedConceptSet.items, (item) => {
						optimizedConcepts.push(item);
					});
					var removedConcepts = [];
					_.each(optimizationResults.removedConceptSet.items, (item) => {
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
		/*
		var this = this;
		this.conceptSets = ko.observableArray();
		this.defaultConceptSetName = ;
		this.ancestorsModalIsShown = ko.observable(false);
		this.isAuthenticated = authApi.isAuthenticated;
		this.canReadConceptsets = ko.pureComputed(function () {
			return (config.userAuthenticationEnabled && this.isAuthenticated() && authApi.isPermittedReadConceptsets()) || !config.userAuthenticationEnabled;
		});
		this.selectedConcepts = sharedState.selectedConcepts;
		this.displayEvidence = ko.pureComputed(function () {
			return (sharedState.evidenceUrl() && sharedState.evidenceUrl()
				.length > 0);
		});
		this.loading = ko.observable(false);
		this.optimalConceptSet = ko.observable(null);
		this.optimizerRemovedConceptSet = ko.observable(null);
		this.optimizerSavingNew = ko.observable(false);
		this.optimizerSavingNewName = ko.observable();
		this.optimizerFoundSomething = ko.pureComputed(function () {
			var returnVal = false;
			if (this.optimalConceptSet() &&
				this.optimalConceptSet()
				.length > 0 &&
				this.selectedConcepts() &&
				this.selectedConcepts()
				.length > 0) {
				returnVal = this.optimalConceptSet()
					.length != this.selectedConcepts()
					.length;
			}
			return returnVal;
		});
		// Set the default concept set to be the current concept set
		
		

		this.ancestors = ko.observableArray([]);
		
		
		this.currentResultSource = ko.observable();
		this.recordCountsRefreshing = ko.observable(false);
		this.recordCountClass = ko.pureComputed(function () {
			return this.recordCountsRefreshing() ? "fa fa-circle-o-notch fa-spin fa-lg" : "fa fa-database fa-lg";
		});

		this.resultSources = ko.computed(function () {
			var resultSources = [];
			$.each(sharedState.sources(), function (i, source) {
				if (source.hasResults) {
					resultSources.push(source);
					if (source.resultsUrl == sharedState.resultsUrl()) {
						this.currentResultSource(source);
					}
				}
			})

			return resultSources;
		}, this);

		this.fields = {
			membership: {
				propName: 'conceptIn1And2',
				value: d => {
					if (d.conceptIn1Only == 1) {
						return '1 Only'
					} else if (d.conceptIn2Only == 1) {
						return '2 Only'
					} else {
						return 'Both'
					}
				},
				isColumn: true,
				isFacet: true,
				label: 'Match',
				isField: true,
			},
			id: {
				propName: 'conceptId',
				value: 'conceptId',
				isColumn: true,
				isFacet: false,
				label: 'Id',
				isField: true,
			},
			code: {
				propName: 'conceptCode',
				value: 'conceptCode',
				isColumn: true,
				isFacet: false,
				label: 'Code',
				isField: true,
			},
			name: {
				propName: 'conceptName',
				value: d => {
					var valid = true; //d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
					return '<a class=' + valid + ' href=\'#/concept/' + d.conceptId + '\'>' + d.conceptName + '</a>';
				},
				isColumn: true,
				isFacet: false,
				label: 'Name',
				isField: true,
			},
			class: {
				propName: 'conceptClassId',
					value: 'conceptClassId',
					isColumn: true,
					isFacet: true,
					label: 'Class',
					isField: true,
			},
			RC: {
				propName: 'recordCount',
				value: 'recordCount',
				isColumn: true,
				isFacet: false,
				label: '<i id="dtConeptManagerRC" class="fa fa-database" aria-hidden="true"></i> RC',
				isField: true,
			},
			DRC: {
				propName: 'descendantRecordCount',
				value: 'descendantRecordCount',
				isColumn: true,
				isFacet: false,
				label: '<i id="dtConeptManagerDRC" class="fa fa-database" aria-hidden="true"></i> DRC',
				isField: true,
			},
			domainId: {
				propName: 'domainId',
				value: 'domainId',
				isColumn: true,
				isFacet: true,
				label: 'Domain',
				isField: true,
			},
			vocabularyId: {
				propName: 'vocabularyId',
				value: 'vocabularyId',
				isColumn: true,
				isFacet: true,
				label: 'Vocabulary',
				isField: true,
			},
			fRC: {
				propName: 'fRecordCount',
				label: 'Has Records',
				value: d => {
					var val = 0;
					if (d.recordCount.replace) {
						val = parseInt(d.recordCount.replace(/\,/g, '')); // Remove comma formatting and treat as int
					} else {
						val = d.recordCount;
					}
					if (val > 0) {
						return 'true'
					} else {
						return 'false'
					}
				},
				isField: true,
				isColumn: false,
				isFacet: true,
			},
			fDRC: {
				propName: 'fDescendantRecordCount',
				label: 'Has Descendant Records',
				value: d => {
					var val = 0;
					if (d.descendantRecordCount.replace) {
						val = parseInt(d.descendantRecordCount.replace(/\,/g, '')); // Remove comma formatting and treat as int
					} else {
						val = d.descendantRecordCount;
					}
					if (val > 0) {
						return 'true'
					} else {
						return 'false'
					}
				},
				isField: true,
				isColumn: false,
				isFacet: true,
			},
		}

		this.renderLink = function (s, p, d) {
			return '<a href=\"#/conceptset/' + d.id + '/details\">' + d.name + '</a>';
		}

		this.routeTo = function (mode) {
			if (this.model.currentConceptSet() == undefined) {
				document.location = '#/conceptset/0/' + mode;
			} else {
				document.location = '#/conceptset/' + this.model.currentConceptSet()
					.id + '/' + mode;
			}
		}

		this.;

		this.conceptSetNameChanged = this.model.currentConceptSet()
			.name.subscribe(function (newValue) {
				if ($.trim(newValue) == this.defaultConceptSetName) {
					$("#txtConceptSetName")
						.css({
							'background-color': '#FF0000'
						});
				} else {
					$("#txtConceptSetName")
						.css({
							'background-color': ''
						});
				}
			});


		this.

		this.

		this.

		this.

		this.overwriteConceptSet = function () {
			var newConceptSet = [];
			_.each(this.optimalConceptSet(), (item) => {
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
			$('#modalConceptSetOptimize')
				.modal('hide');
		}

		this.copyOptimizedConceptSet = function () {
			if (this.model.currentConceptSet() == undefined) {
				this.optimizerSavingNewName(this.conceptSetName());
			} else {
				this.optimizerSavingNewName(this.model.currentConceptSet()
					.name() + " - OPTIMIZED");
			}
			this.optimizerSavingNew(true);
		}

		this.saveNewOptimizedConceptSet = function () {
			var conceptSet = {};
			conceptSet.id = 0;
			conceptSet.name = this.optimizerSavingNewName;
			var selectedConcepts = [];
			_.each(this.optimalConceptSet(), (item) => {
				var newItem;
				newItem = {
					concept: item.concept,
					isExcluded: ko.observable(item.isExcluded),
					includeDescendants: ko.observable(item.includeDescendants),
					includeMapped: ko.observable(item.includeMapped),
				}
				selectedConcepts.push(newItem);
			})
			this.saveConceptSet("#txtOptimizerSavingNewName", conceptSet, selectedConcepts);
			this.optimizerSavingNew(false);
		}

		this.cancelSaveNewOptimizedConceptSet = function () {
			this.optimizerSavingNew(false);
		}

		

		this.conceptsetSelected = function (d) {
			$('#modalCS')
				.modal('hide');
			vocabularyAPI.getConceptSetExpression(d.id)
				.then(function (csExpression) {
					this.targetId(d.id);
					this.targetCaption(d.name);
					this.targetExpression(csExpression.items);
				});
		}


		this.

		this.

		this.toggleOnSelectAllCheckbox = function (selector, selectAllElement) {
			$(document)
				.on('init.dt', selector, function (e, settings) {
					$(selectAllElement)
						.addClass("selected");
				});
		}

		this.toggleOffSelectAllCheckbox = function (selector, selectAllElement) {
			$(document)
				.on('init.dt', selector, function (e, settings) {
					$(selectAllElement)
						.removeClass("selected");
				});
		}

		this.selectAllConceptSetItems = function (selector, props) {
			if (!this.canEdit()) {
				return;
			}
			props = props || {};
			props.isExcluded = props.isExcluded || null;
			props.includeDescendants = props.includeDescendants || null;
			props.includeMapped = props.includeMapped || null;
			var selectAllValue = !($(selector)
				.hasClass("selected"));
			$(selector)
				.toggleClass("selected");
			_.each(this.selectedConcepts(), (conceptSetItem) => {
				if (props.isExcluded !== null) {
					conceptSetItem.isExcluded(selectAllValue);
				}
				if (props.includeDescendants !== null) {
					conceptSetItem.includeDescendants(selectAllValue);
				}
				if (props.includeMapped !== null) {
					conceptSetItem.includeMapped(selectAllValue);
				}
			});
			this.model.resolveConceptSetExpression();
		}

		this.refreshRecordCounts = function (obj, event) {
			if (event.originalEvent) {
				// User changed event
				this.recordCountsRefreshing(true);
				$("#dtConeptManagerRC")
					.toggleClass("fa-database")
					.toggleClass("fa-circle-o-notch")
					.toggleClass("fa-spin");
				$("#dtConeptManagerDRC")
					.toggleClass("fa-database")
					.toggleClass("fa-circle-o-notch")
					.toggleClass("fa-spin");
				var compareResults = this.compareResults();
				var conceptIds = $.map(compareResults, function (o, n) {
					return o.conceptId;
				});
				cdmResultsAPI.getConceptRecordCount(this.currentResultSource()
						.sourceKey, conceptIds, compareResults)
					.then(function (rowcounts) {
						this.compareResults(compareResults);
						this.recordCountsRefreshing(false);
						$("#dtConeptManagerRC")
							.toggleClass("fa-database")
							.toggleClass("fa-circle-o-notch")
							.toggleClass("fa-spin");
						$("#dtConeptManagerDRC")
							.toggleClass("fa-database")
							.toggleClass("fa-circle-o-notch")
							.toggleClass("fa-spin");
					});
			}
		}

		this.

		// Initialize the select all checkboxes
		var excludeCount = 0;
		var descendantCount = 0;
		var mappedCount = 0;
		_.each(this.selectedConcepts(), (conceptSetItem) => {
			if (conceptSetItem.isExcluded()) {
				excludeCount++;
			}
			if (conceptSetItem.includeDescendants()) {
				descendantCount++;
			}
			if (conceptSetItem.includeMapped()) {
				mappedCount++;
			}
		});
		if (excludeCount == this.selectedConcepts()
			.length) {
			this.toggleOnSelectAllCheckbox('.conceptSetTable', '#selectAllExclude');
		} else {
			this.toggleOffSelectAllCheckbox('.conceptSetTable', '#selectAllExclude');
		}
		if (descendantCount == this.selectedConcepts()
			.length) {
			this.toggleOnSelectAllCheckbox('.conceptSetTable', '#selectAllDescendants');
		} else {
			this.toggleOffSelectAllCheckbox('.conceptSetTable', '#selectAllDescendants');
		}
		if (mappedCount == this.selectedConcepts()
			.length) {
			this.toggleOnSelectAllCheckbox('.conceptSetTable', '#selectAllMapped');
		} else {
			this.toggleOffSelectAllCheckbox('.conceptSetTable', '#selectAllMapped');
		}
		// Create event handlers for all of the select all elements
		$(document)
			.off('click', '#selectAllExclude');
		$(document)
			.on('click', '#selectAllExclude', function () {
				this.selectAllConceptSetItems("#selectAllExclude", {
					isExcluded: true
				})
			});
		$(document)
			.off('click', '#selectAllDescendants');
		$(document)
			.on('click', '#selectAllDescendants', function () {
				this.selectAllConceptSetItems("#selectAllDescendants", {
					includeDescendants: true
				})
			});
		$(document)
			.off('click', '#selectAllMapped');
		$(document)
			.on('click', '#selectAllMapped', function () {
				this.selectAllConceptSetItems("#selectAllMapped", {
					includeMapped: true
				})
			});
		
		this.showAncestorsModal = conceptSetService.getAncestorsModalHandler(this);
		
		
		this.canEdit = this.model.canEditCurrentConceptSet;
		
		
		this.copyToClipboard = function
		
		this.copyIdentifierListToClipboard = function() {
			
		}
		
		this.copyIncludedConceptIdentifierListToClipboard = function() {
			
		}

	var component = {
		viewModel: conceptsetManager,
		template: view
	};

	ko.components.register('', component);
	return component;
	*/
	}

	return commonUtils.build('conceptset-manager', ConceptsetManager, view);
});
