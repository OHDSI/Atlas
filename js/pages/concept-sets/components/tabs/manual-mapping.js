define([
	'knockout',
	'text!./manual-mapping.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'atlas-state',
	'const',
	'utils/Renderers',
	'services/MomentAPI',
	'services/ConceptSet',
	'components/conceptset/utils',
	'services/http',
	'services/Vocabulary',
	'less!./manual-mapping.less',
	'components/conceptAddBox/concept-add-box',
	'components/dataSourceSelect',
	'components/conceptAddBox/preview/conceptset-expression-preview',
	'components/conceptAddBox/preview/included-preview',
	'components/conceptAddBox/preview/included-preview-badge',
	'components/conceptAddBox/preview/included-sourcecodes-preview',
	'components/conceptset/included-sourcecodes',
], function (
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	sharedState,
	globalConstants,
	renderers,
	momentApi,
	conceptSetService,
	conceptSetUtils,
	httpService,
	vocabularyService,
) {

	class ManualMapping extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.loading = params.loading;
			this.tableOptions = params.tableOptions || commonUtils.getTableOptions('M');


			this.currentConcept = params.currentConcept;
			this.conceptSetStore = params.conceptSetStore;

			this.standardConceptsWithCounterparts = params.standardConceptsWithCounterparts;
			this.resultConceptSetItems = params.resultConceptSetItems;
			this.showManualMappingModal = params.showManualMappingModal;
			this.addedSourceCodesViaManualMapping = params.addedSourceCodesViaManualMapping;

			this.nonStandardConceptsForCurrentStandard = ko.observableArray([]);
			this.loadingNonStandardConceptsForCurrentStandard = ko.observable(false);

			this.includedSourcecodes = ko.observableArray([]);
			this.loadingIncludedSourceCodes = ko.observable(false);


			this.relatedSourcecodesColumns = globalConstants.getRelatedSourcecodesColumns(sharedState, { canEditCurrentConceptSet: this.canEdit },
				(data, selected) => {
					const conceptIds = data.map(c => c.CONCEPT_ID);
					ko.utils.arrayForEach(this.includedSourcecodes(), c => conceptIds.indexOf(c.CONCEPT_ID) > -1 && c.isSelected(selected));
					this.includedSourcecodes.valueHasMutated();
				});
			this.relatedSourcecodesOptions = globalConstants.relatedSourcecodesOptions;

			this.buttonTooltip = conceptSetUtils.getPermissionsText(true, "test");

			const getNonStandardConceptsColumns = (context, commonUtils, selectAllFn) => [
				{
					title: '',
					orderable: false,
					searchable: false,
					className: 'text-center',
					render: () => renderers.renderCheckbox('isSelected', context.canEditCurrentConceptSet()),
					renderSelectAll: context.canEditCurrentConceptSet(),
					selectAll: selectAllFn
				},
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
						momentApi.formatDateTimeWithFormat(d['VALID_START_DATE'], momentApi.DATE_FORMAT),
					visible: false
				},
				{
					title: ko.i18n('columns.validEndDate', 'Valid End Date'),
					render: (s, type, d) => type === "sort" ? +d['VALID_END_DATE'] :
						momentApi.formatDateTimeWithFormat(d['VALID_END_DATE'], momentApi.DATE_FORMAT),
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
			];

			this.nonStandardConceptsColumns = getNonStandardConceptsColumns({
				canEditCurrentConceptSet: this.canEdit
			},
				commonUtils,
				(data, selected) => {
					const conceptIds = data.map(c => c.CONCEPT_ID);
					ko.utils.arrayForEach(this.nonStandardConceptsForCurrentStandard(), c => conceptIds.indexOf(c.CONCEPT_ID) > -1 && c.isSelected(selected));
					this.nonStandardConceptsForCurrentStandard.valueHasMutated();
				});



			this.relatedSourcecodesColumns = globalConstants.getRelatedSourcecodesColumns(sharedState, { canEditCurrentConceptSet: this.canEdit },
				(data, selected) => {
					const conceptIds = data.map(c => c.CONCEPT_ID);
					ko.utils.arrayForEach(this.includedSourcecodes(), c => conceptIds.indexOf(c.CONCEPT_ID) > -1 && c.isSelected(selected));
					this.includedSourcecodes.valueHasMutated();
				});

			this.overrideHandleAddToConceptSet = (selectedItemsToAdd) => { this.overrideAddToConceptSet(selectedItemsToAdd); };


			this.loadNonStandardForCurrentStandard();
			this.loadIncludedSourceCodes();
		}


		overrideAddToConceptSet(selectedItemsToAdd) {
			console.log("overrideAddToConceptSet");
			this.addedSourceCodesViaManualMapping(selectedItemsToAdd);
		}

		async loadNonStandardForCurrentStandard() {
			let standardConceptId = this.currentConcept.CONCEPT_ID;
			if (!standardConceptId) {
				console.warn("No standard concept available to process.");
				return;
			}
			try {
				this.loadingNonStandardConceptsForCurrentStandard(true);
				let relatedNonStandardConceptsIds = this.currentConcept.mapped_from;
				let relatedNonStandardConcepts = this.resultConceptSetItems().filter(item => item.concept.STANDARD_CONCEPT === 'N' && relatedNonStandardConceptsIds.some(id => item.concept.CONCEPT_ID === id));
				const formattedConcepts = relatedNonStandardConcepts.map(concept => {
					return {
						...concept.concept,
						isSelected: ko.observable(false),
						isExcluded: ko.observable(false),
						includeDescendants: ko.observable(false),
						includeMapped: ko.observable(false)
					};
				});
				this.nonStandardConceptsForCurrentStandard(formattedConcepts); // Update the observable array with filtered related non-standard concepts
			} catch (err) {
				console.error("Error loading non-standard concepts for the standard concept ID: " + standardConceptId, err);
				this.nonStandardConceptsForCurrentStandard([]); // Handle error by providing an empty array
			} finally {
				this.loadingNonStandardConceptsForCurrentStandard(false);
			}
		}

		formatDate(date) {
			return momentApi.formatDateTimeWithFormat(date, momentApi.ISO_DATE_FORMAT);
		}

		mapAllSelectedToGivenStandardConcept() {

			if (!this.currentConcept || typeof this.currentConcept.CONCEPT_ID === 'undefined') {
				console.warn("No valid standard concept available to map.");
				return;
			}

			let standardConceptId = this.currentConcept.CONCEPT_ID;

			const selectedNonStandardConcepts = this.nonStandardConceptsForCurrentStandard().filter(item => item.isSelected());

			if (selectedNonStandardConcepts.length === 0) {
				console.warn("No selected non-standard concepts to map.");
				return;
			}

			// Remove the selected non-standard concepts from resultConceptSetItems
			let resultConceptSetItemsWithoutMappedNonStandardConcepts = this.resultConceptSetItems().filter(item => !selectedNonStandardConcepts.some(selectedConcept => selectedConcept.CONCEPT_ID === item.concept.CONCEPT_ID));
			this.resultConceptSetItems(resultConceptSetItemsWithoutMappedNonStandardConcepts);

			// Add current standard concept to resultConceptSetItems if not already present
			if (!this.resultConceptSetItems().some(item => item.concept.CONCEPT_ID === standardConceptId)) {
				this.resultConceptSetItems().push({
					concept: this.currentConcept,
					isSelected: ko.observable(false),
					isExcluded: ko.observable(false),
					includeDescendants: ko.observable(false),
					includeMapped: ko.observable(false)
				});
			}

			// Optionally remove the current standard concept from standardConceptsWithCounterparts
			let standardConceptsWithCounterpartsWithoutCurrentMappedConcept = this.standardConceptsWithCounterparts().filter(item => item.CONCEPT_ID !== standardConceptId);
			this.standardConceptsWithCounterparts(standardConceptsWithCounterpartsWithoutCurrentMappedConcept);

			this.showManualMappingModal(false);
			console.log("Mapping complete: Selected non-standard concepts have been mapped to the current standard concept.");
		}

		async loadIncludedSourceCodes() {
			this.loadingIncludedSourceCodes(true);

			let standardConceptId = this.currentConcept.CONCEPT_ID;
			const selectedNonStandardConcepts = this.nonStandardConceptsForCurrentStandard().filter(item => item.isSelected());

			let allConceptsIds = [
				this.currentConcept.CONCEPT_ID,
				...selectedNonStandardConcepts.map(concept => concept.CONCEPT_ID)
			];
			try {
				const data = await vocabularyService.getMappedConceptsById(allConceptsIds);
				await vocabularyService.loadDensity(data);
				const normalizedData = data.map(item => ({
					...item,
					isSelected: ko.observable(false),
				}))
				this.includedSourcecodes(normalizedData);
				return data;
			} catch (err) {
				console.error(err);
			} finally {
				this.loadingIncludedSourceCodes(false);
			}
		}

		isEnabledMapAllSelectedToGivenStandardConcept() {
			return true;
		}

		canAddConcepts() {
			return true;
		}

		getSelectedIncludedSourcecodes() {
			return ko.unwrap(this.includedSourcecodes) && commonUtils.getSelectedConcepts(this.includedSourcecodes);
		}

		canEdit() {
			return true;
		}
	}

	return commonUtils.build('manual-mapping', ManualMapping, view);
});