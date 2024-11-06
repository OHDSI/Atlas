const { add } = require("lodash");

define([
	'knockout',
	'text!./resolve-mappings.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'atlas-state',
	'const',
	'services/ConceptSet',
	'components/conceptset/utils',
	'utils/Renderers',
	'services/MomentAPI',
	'services/http',
	'less!./resolve-mappings.less',
	'./manual-mapping',
	'components/conceptAddBox/concept-add-box',
	'components/dataSourceSelect',
	'components/conceptAddBox/preview/conceptset-expression-preview',
	'components/conceptAddBox/preview/included-preview',
	'components/conceptAddBox/preview/included-preview-badge',
	'components/conceptAddBox/preview/included-sourcecodes-preview',

], function (
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	sharedState,
	globalConstants,
	conceptSetService,
	conceptSetUtils,
	renderers,
	MomentApi,
	httpService,
) {

	class ResolveConceptSetMappings extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.loading = params.loading;
			this.canEdit = params.canEdit;
			this.tableOptions = params.tableOptions || commonUtils.getTableOptions('M');
			const tableOptions = this.tableOptions;
			this.conceptSetStore = params.conceptSetStore;

			this.showPreviewModal = ko.observable(false);


			this.previewConcepts = ko.observableArray();
			this.previewTabsParams = ko.observable({
				tabs: [
					{
						title: ko.i18n('components.conceptAddBox.previewModal.tabs.concepts', 'Concepts'),
						key: 'expression',
						componentName: 'conceptset-expression-preview',
						componentParams: {
							tableOptions,
							conceptSetItems: this.previewConcepts
						},
					},
					{
						title: ko.i18n('cs.manager.tabs.includedConcepts', 'Included Concepts'),
						key: 'included',
						componentName: 'conceptset-list-included-preview',
						componentParams: {
							tableOptions,
							previewConcepts: this.previewConcepts
						},
						hasBadge: true,
					},
					{
						title: ko.i18n('cs.manager.tabs.includedSourceCodes', 'Source Codes'),
						key: 'included-sourcecodes',
						componentName: 'conceptset-list-included-sourcecodes-preview',
						componentParams: {
							tableOptions,
							previewConcepts: this.previewConcepts
						},
					}
				]
			});

			this.commonUtils = commonUtils;
			this.datatableLanguage = ko.i18n('datatable.language');
			this.conceptSetItems = ko.pureComputed(() => (this.conceptSetStore.current() && this.conceptSetStore.current().expression.items()) || []);

			this.initialIncludedConcepts = ko.observableArray([]);
			this.initialStandardConceptsWithCounterparts = ko.observableArray([]);
			this.resultConceptSetItems = ko.observableArray([]);
			this.loadingResultConceptSetItems = ko.observable(false);

			this.standardConceptsWithCounterparts = ko.observableArray([]);
			this.loadingStandardConceptsWithCounterparts = ko.observable(false);

			this.isResolveButtonEnabled = ko.pureComputed(() => {
				const mappings = this.standardConceptsWithCounterparts();
				return mappings.some(concept => {
					return concept.mapped_from && concept.mapped_from.length === 1 && mappings.filter(m => m.mapped_from && m.mapped_from.includes(concept.mapped_from[0])).length === 1;
				});
			});

			this.addedSourceCodesViaManualMapping = ko.observableArray([]);
			this.enrichStandardWithCounterpartsAndResultsWithSourceCodes = this.enrichStandardWithCounterpartsAndResultsWithSourceCodes.bind(this);
			this.addedSourceCodesViaManualMapping.subscribe((addedSourceCodes) => {
				this.enrichStandardWithCounterpartsAndResultsWithSourceCodes(addedSourceCodes);
			});

			/** MANUAL MAPPING VARIABLES */
			this.showManualMappingModal = ko.observable(false);
			this.manualMappingModalParams = ko.observable(null);
			this.standardConceptsWithCounterpartsRowClick = (conceptRowData) => {
				this.openManualMapping(conceptRowData);
			}

			this.openManualMapping = (conceptRowData) => {
				this.manualMappingModalParams(
					{
						currentConcept: conceptRowData,
						tableOptions: this.tableOptions,
						conceptSetStore: this.conceptSetStore,
						standardConceptsWithCounterparts: this.standardConceptsWithCounterparts,
						resultConceptSetItems: this.resultConceptSetItems,
						showManualMappingModal: this.showManualMappingModal,
						addedSourceCodesViaManualMapping: this.addedSourceCodesViaManualMapping,
					}
				);
				this.showManualMappingModal(true);
			}

			this.canEditCurrentConceptSet = params.canEdit;
			this.resultConceptSetColumns = [
				{
					data: 'concept.CONCEPT_ID',
				},
				{
					data: 'concept.CONCEPT_CODE',
				},
				{
					render: commonUtils.renderBoundLink,
				},
				{
					data: 'concept.DOMAIN_ID',
				},
				{
					data: 'concept.STANDARD_CONCEPT',
					visible: false,
				},
				{
					data: 'concept.STANDARD_CONCEPT_CAPTION',
				},
			];

			this.buttonTooltip = conceptSetUtils.getPermissionsText(true, "test");

			this.standardConceptsColumns = [
				{
					title: ko.i18n('columns.id', 'Id'),
					data: 'CONCEPT_ID'
				},
				{
					title: ko.i18n('columns.code', 'Code'),
					data: 'CONCEPT_CODE'
				},
				{
					title: ko.i18n('columns.name', 'Name'),
					data: 'CONCEPT_NAME',
					render: function (s, p, d) {
						var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
						if (p === 'display') {
							return '<a class="' + valid + '" style="color: #007bff; cursor: pointer; text-decoration: none;" onclick="event.preventDefault();">' + d.CONCEPT_NAME + '</a>';
						}
						return d.CONCEPT_NAME;
					}
				},
				{
					title: ko.i18n('columns.class', 'Class'),
					data: 'CONCEPT_CLASS_ID'
				},
				{
					title: ko.i18n('columns.standardConceptCaption', 'Standard Concept Caption'),
					data: 'STANDARD_CONCEPT_CAPTION',
					visible: false
				},
				{
					title: ko.i18n('columns.validStartDate', 'Valid Start Date'),
					render: (s, type, d) => type === "sort" ? +d['VALID_START_DATE'] :
						MomentApi.formatDateTimeWithFormat(d['VALID_START_DATE'], MomentApi.DATE_FORMAT),
					visible: false
				},
				{
					title: ko.i18n('columns.validEndDate', 'Valid End Date'),
					render: (s, type, d) => type === "sort" ? +d['VALID_END_DATE'] :
						MomentApi.formatDateTimeWithFormat(d['VALID_END_DATE'], MomentApi.DATE_FORMAT),
					visible: false
				},
				{
					title: ko.i18n('columns.domain', 'Domain'),
					data: 'DOMAIN_ID'
				},
				{
					title: ko.i18n('columns.vocabulary', 'Vocabulary'),
					data: 'VOCABULARY_ID'
				},
				{
					title: ko.i18n('columns.mappedNonStandardCount', 'Mapped Non-Standard Count'),
					data: function (item) {
						return ko.computed(() => {
							return this.countMappedNonStandard(item);
						}).peek();
					}.bind(this)
				},
			];

			this.includedSourcecodes = this.conceptSetStore.includedSourcecodes;

			this.showWarningModal = ko.observable(false);
			this.warningModalMessage = ko.observable('');
			this.closeWarningModal = () => {
				this.showWarningModal(false);
			};

			this.loadInitialIncludedConcepts();  //detached copy of the initial concept set, used for resetting to the initial state and first fill of resultConceptSetItems
			this.loadResultConceptSetItems();  //detached copy of the initialIncludedConcepts
			this.loadStandardWithCounterparts();
		}

		countMappedNonStandard(concept) {
			if (concept.mapped_from) {
				return concept.mapped_from.length;
			}
			return 0;
		}

		deepClone(item) {
			return JSON.parse(JSON.stringify(item));
		}

		loadInitialIncludedConcepts() {
			const uniqueItemsMap = new Map();
			this.conceptSetItems().forEach((item) => {
				const conceptId = item.concept.CONCEPT_ID;
				if (!uniqueItemsMap.has(conceptId)) {
					const clonedItem = this.deepClone(item);
					uniqueItemsMap.set(conceptId, {
						...clonedItem,
						idx: uniqueItemsMap.size, // idx will correspond to the index in the map
						isSelected: ko.observable(false),
						isExcluded: ko.observable(false),
						includeDescendants: ko.observable(false),
						includeMapped: ko.observable(false),
					});
				}
			});
			this.initialIncludedConcepts(Array.from(uniqueItemsMap.values()));
		}

		async loadResultConceptSetItems() {
			try {
				this.loadingResultConceptSetItems(true);
				const uniqueItemsMap = new Map();
				this.initialIncludedConcepts().forEach((item) => {
					const conceptId = item.concept.CONCEPT_ID;
					if (!uniqueItemsMap.has(conceptId)) {
						const clonedItem = this.deepClone(item);
						uniqueItemsMap.set(conceptId, {
							...clonedItem,
							idx: uniqueItemsMap.size, // idx will correspond to the index in the map
							isSelected: ko.observable(false),
							isExcluded: ko.observable(false),
							includeDescendants: ko.observable(false),
							includeMapped: ko.observable(false),
						});
					}
				});
				this.resultConceptSetItems(Array.from(uniqueItemsMap.values()));
			} catch (err) {
				console.error("Error loading result concept set items:", err);
			} finally {
				this.loadingResultConceptSetItems(false);
			}
		}

		async enrichStandardWithCounterpartsAndResultsWithSourceCodes(addedSourceCodes) {
			try {
				this.loadingStandardConceptsWithCounterparts(true);
				this.loadingResultConceptSetItems(true);
				let standardForNonStandardWithMappings = await this.loadRelatedStandardConceptsWithMapping(addedSourceCodes);
				let currentStandardsWithCounterparts = this.standardConceptsWithCounterparts();
				let combinedListOfStandardsWithMappings = [
					...standardForNonStandardWithMappings,
					...currentStandardsWithCounterparts.filter(item => !standardForNonStandardWithMappings || standardForNonStandardWithMappings.length === 0 || standardForNonStandardWithMappings.some(existingItem => existingItem.CONCEPT_ID !== item.CONCEPT_ID))];

				this.standardConceptsWithCounterparts(combinedListOfStandardsWithMappings);

				//add to current results
				let currentResults = this.resultConceptSetItems();

				let addedConcepts = addedSourceCodes.map(sc => {
					return {
						...sc,
						isSelected: ko.observable(false),
						isExcluded: ko.observable(sc.isExcluded),
						includeDescendants: ko.observable(sc.isExcluded),
						includeMapped: ko.observable(sc.isExcluded),
					}
				});

				let combinedResultItems = [
					...currentResults,
					...addedConcepts,
				];
				this.resultConceptSetItems(combinedResultItems);
			} catch (err) {
				console.error("Error enriching standard counterparts:", err);
			} finally {
				this.loadingStandardConceptsWithCounterparts(false);
				this.loadingResultConceptSetItems(false);
			}
		}

		async loadStandardWithCounterparts() {
			try {
				this.loadingStandardConceptsWithCounterparts(true);
				let standardForNonStandardWithMappings = await this.loadRelatedStandardConceptsWithMapping(this.initialIncludedConcepts());
				// Set the data avoiding duplicates
				this.standardConceptsWithCounterparts(standardForNonStandardWithMappings);
				this.initialStandardConceptsWithCounterparts(standardForNonStandardWithMappings);
			} catch (err) {
				console.error("Error loading standard counterparts:", err);
			} finally {
				this.loadingStandardConceptsWithCounterparts(false);
			}
		}

		async loadRelatedStandardConceptsWithMapping(concepts) {
			const nonStandardConcepts = concepts.filter(c => c.concept.STANDARD_CONCEPT !== 'S' && c.concept.STANDARD_CONCEPT !== 'C');
			let nonStandardConceptsIds = nonStandardConcepts.map(concept => concept.concept.CONCEPT_ID);
			const { data: relatedStandardMappedConcepts } = await httpService.doPost(sharedState.vocabularyUrl() + 'related-standard', nonStandardConceptsIds);

			const relatedStandardMappedConceptsWithFlags = relatedStandardMappedConcepts.map(concept => {
				return {
					...concept,
					isSelected: ko.observable(false),
					isExcluded: ko.observable(false),
					includeDescendants: ko.observable(false),
					includeMapped: ko.observable(false),
				}
			});

			return Array.from(relatedStandardMappedConceptsWithFlags);
		}

		renderCheckbox(field, clickable = true) {
			return `<span data-bind="${clickable ? `click: function(d) { d.${field}(!d.${field}()); event.stopPropagation(); },` : ''} css: { selected: ${field} }" class="fa fa-check"></span>`;
		}

		getSelectedConcepts() {
			return ko.unwrap(this.includedSourcecodes) && commonUtils.getSelectedConcepts(this.includedSourcecodes);
		}

		resolveOneToOneMappings() {
			const conceptIdsToRemoveFromStandard = new Set();
			let showWarning = false;
			const updatedItems = this.resultConceptSetItems().map((item) => {
				if (item.concept.STANDARD_CONCEPT === 'N') {
					const mappedStandardConcepts = this.standardConceptsWithCounterparts().filter(m => m.mapped_from && m.mapped_from.some(mappedId => mappedId === item.concept.CONCEPT_ID));
					if (mappedStandardConcepts.length > 1) {
						showWarning = true;
						return item;
					}
					if (mappedStandardConcepts.length === 1) {
						if (mappedStandardConcepts[0].mapped_from.length === 1) {
							conceptIdsToRemoveFromStandard.add(mappedStandardConcepts[0].CONCEPT_ID);
							return {
								...item,
								concept: mappedStandardConcepts[0],
								isSelected: ko.observable(false),
								isExcluded: ko.observable(false),
								includeDescendants: ko.observable(false),
								includeMapped: ko.observable(false),
							};
						}
					}
				}
				return item;
			});

			const unmappableStandardConceptsToRetain = this.standardConceptsWithCounterparts().filter(mapping =>
				!conceptIdsToRemoveFromStandard.has(mapping.CONCEPT_ID)
			);

			this.standardConceptsWithCounterparts(unmappableStandardConceptsToRetain);
			this.resultConceptSetItems(updatedItems);

			if (showWarning) {
				this.warningModalMessage('Encountered non-standard concepts mapped to multiple standard concepts. Please resolve those mappings manually.');
				this.showWarningModal(true);
			}
		}

		handlePreview() {
			let itemsForPreview = this.resultConceptSetItems().map(item => {
				return {
					...item,
					isExcluded: ko.observable(false),
					includeDescendants: ko.observable(false),
					includeMapped: ko.observable(false),
				}
			})
			this.previewConcepts(itemsForPreview);
			this.showPreviewModal(true);
		}

		handleSubmit() {
			let itemsForPreview = this.resultConceptSetItems().map(item => {
				return {
					...item,
					isExcluded: ko.observable(false),
					includeDescendants: ko.observable(false),
					includeMapped: ko.observable(false),
				}
			})
			this.conceptSetStore.current().expression.items(itemsForPreview);
		}

		isPreviewAvailable() {
			return true;
		}

		resetToInitialState() {
			this.loadResultConceptSetItems();
			let initialConcepts = this.initialStandardConceptsWithCounterparts().map(initialConcept => {
				return {
					...this.deepClone(initialConcept),
					isSelected: ko.observable(false),
					isExcluded: ko.observable(false),
					includeDescendants: ko.observable(false),
					includeMapped: ko.observable(false),
				};
			});
			this.standardConceptsWithCounterparts(initialConcepts);
		}
	}

	return commonUtils.build('resolve-mappings', ResolveConceptSetMappings, view);
});