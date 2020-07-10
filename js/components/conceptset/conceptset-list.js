define([
	'knockout',
	'text!./conceptset-list.html',
	'appConfig',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'atlas-state',
	'services/ConceptSet',
	'conceptsetbuilder/InputTypes/ConceptSet',
	'./consts',
	'utils/ExceptionUtils',
	'components/tabs',
	'./conceptset-list/expression',
	'./conceptset-list/included',
	'./conceptset-list/included-badge',
	'./conceptset-list/included-sourcecodes',
	'./conceptset-list/export',
	'./conceptset-list/import',
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
	ConceptSet,
	{ ConceptSetTabKeys },
	exceptionUtils,
) {

	class ConceptSetList extends AutoBind(Component) {

		constructor(params) {
			super(params);
			this.conceptSets = params.conceptSets;
			this.exportCSV = typeof params.exportCSV !== 'undefined' ? params.exportCSV : true;
			this.currentConceptSetSource = params.conceptSetSource;
			this.conceptSetStoreKey = `${this.currentConceptSetSource}ConceptSet`;
			this.canEdit = params.canEdit || (() => false);
			this.exportConceptSets = params.exportConceptSets || (() => false);
			this.currentConceptSet = sharedState[this.conceptSetStoreKey].current;
			this.selectedConcepts = sharedState[this.conceptSetStoreKey].selectedConcepts;
			this.showImportConceptSetModal = ko.observable();
			this.includedHash = sharedState[this.conceptSetStoreKey].includedHash;
			this.exporting = ko.observable();
			this.importing = ko.observable();
			this.disableConceptSetExport = ko.observable(); //TODO implement export
			this.disableConceptSetExportMessage = ko.observable();
			this.currentCohortDefinitionMode = sharedState.CohortDefinition.mode;
			this.loading = ko.observable();
			this.tableApi = ko.observable();
			this.options = {
				deferRender: true,
				orderClasses: false,
				autoWidth: false,
				order: [ 1, 'asc' ],
				columnDefs: [
					{ width: '25px', targets: 0},
					{ width: '100%', targets: 1},
				],
				stripeClasses : [ 'repositoryConceptSetItem' ],
				columns: [
					{ data: 'id', title: 'Id', width: '25px'},
					this.getDataboundColumn('name', 'Title', '100%')
				],
				language: {
					search: 'Filter Concept Sets:'
				},
				select: {
					style: 'single',
					info: false,
					toggleable: false,
				},
			};
			this.selectedTabKey = ko.observable(ConceptSetTabKeys.EXPRESSION);
			const tabParams = {
				...params,
				conceptSetListTableApi: this.tableApi,
				currentConceptSet: this.currentConceptSet,
				currentConceptSetSource: this.currentConceptSetSource,
				selectedConcepts: this.selectedConcepts,
				loadConceptSet: this.loadConceptSet,
				loading: this.loading,
				importing: this.importing,
				selectedTabKey: this.selectedTabKey,
			};
			this.tabs = [
				{
					title: 'Concept Set Expression',
					key: ConceptSetTabKeys.EXPRESSION,
					componentName: 'conceptset-list-expression',
					componentParams: tabParams,
				},
				{
					title: 'Included Concepts',
					key: ConceptSetTabKeys.INCLUDED,
					componentName: 'conceptset-list-included',
					componentParams: tabParams,
					hasBadge: true,
				},
				{
					title: 'Included Source Codes',
					key: ConceptSetTabKeys.SOURCECODES,
					componentName: 'conceptset-list-included-sourcecodes',
					componentParams: tabParams,
				},
				{
					title: 'Export',
					key: ConceptSetTabKeys.EXPORT,
					componentName: 'conceptset-list-export',
					componentParams: tabParams,
				},
				{
					title: 'Import',
					key: ConceptSetTabKeys.IMPORT,
					componentName: 'conceptset-list-import',
					componentParams: tabParams,
				}
			];
			this.subscriptions.push(this.tableApi.subscribe(() => {
				this.currentConceptSet() && this.markConceptSetSelected(this.currentConceptSet());
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
			this.showImportConceptSetModal(false);
			if (conceptSet.id !== (this.currentConceptSet() && this.currentConceptSet().id)) {
				this.includedHash(null);
				this.selectedTabKey(ConceptSetTabKeys.EXPRESSION);
				await this.loadConceptSet(conceptSet.id);
			}
		}

		async loadConceptSet(conceptSetId) {
			this.selectedTabKey(ConceptSetTabKeys.EXPRESSION);
			const conceptSet = this.conceptSets().find(item => item.id === conceptSetId);
			if (!conceptSet) {
				return;
			}
			const items = ko.unwrap(conceptSet.expression.items);
			if (items && items.length > 0 && !items[0].concept.STANDARD_CONCEPT) {
				const identifiers = Array.from(conceptSet.expression.items())
					.map(() => {
						return this.concept.CONCEPT_ID;
					});
				const { data } = await conceptSetService.lookupIdentifiers(identifiers);
				data.forEach((item, index) => conceptSet.expression.items()[index].concept = item);
				conceptSet.expression.items.valueHasMutated();
			}
			conceptSetService.addToConceptSetIdsMap({ concepts: items, source: this.currentConceptSetSource });
			this.selectedConcepts(items);
			const c = {
				name: conceptSet.name,
				id: conceptSet.id,
			}
			this.currentConceptSet(c);
			conceptSetService.resolveConceptSetExpression({ source: this.currentConceptSetSource });
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
			this.selectedTabKey(ConceptSetTabKeys.IMPORT);
			this.markConceptSetSelected(conceptSet);
			
		};

		async selectTab(tab) {
			const key = this.tabs[tab].key;
			this.selectedTabKey(key);
			this.loading(true);
			try {
				await conceptSetService.onCurrentConceptSetModeChanged({ mode: key, source: this.currentConceptSetSource });
			} finally {
				this.loading(false);
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