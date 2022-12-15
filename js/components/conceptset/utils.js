define(['knockout','utils/CommonUtils', 'utils/Renderers', 'services/http','atlas-state','services/Vocabulary', 'services/MomentAPI', './InputTypes/ConceptSet', './InputTypes/ConceptSetItem']
, function(ko, commonUtils, renderers, httpService, sharedState, vocabularyService, MomentApi, ConceptSet, ConceptSetItem){
	
  function toRepositoryConceptSetItems(conceptSetItems){
    const convertedItems = conceptSetItems.map((item) => ({
        conceptId: item.concept.CONCEPT_ID,
        isExcluded: +ko.unwrap(item.isExcluded),
        includeDescendants: +ko.unwrap(item.includeDescendants),
        includeMapped: +ko.unwrap(item.includeMapped)
		}));
    return convertedItems;
  }

	const recommendedRelationshipRenderFunction = (s,p,d) => {
		const tooltip = d.RELATIONSHIPS.map(d => commonUtils.escapeTooltip(d)).join('<br/>');
		return `<span data-bind="tooltip: '${tooltip}'">${d.RELATIONSHIPS.length}</span>`
	};

	const getRecommendedConceptColumns = (sharedState, context, selectAllFn) => [
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
			render: commonUtils.renderLink,
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
			title: ko.i18n('columns.rc', 'RC'),
			data: 'RECORD_COUNT',
			className: 'numeric'
		},
		{
			title: ko.i18n('columns.drc', 'DRC'),
			data: 'DESCENDANT_RECORD_COUNT',
			className: 'numeric'
		},
		{
			title: ko.i18n('columns.pc', 'PC'),
			data: 'PERSON_COUNT',
			className: 'numeric',
		},
		{
			title: ko.i18n('columns.dpc', 'DPC'),
			data: 'DESCENDANT_PERSON_COUNT',
			className: 'numeric',
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
			title: ko.i18n('columns.recommendedRelationshipCount', 'Count'),
			data: 'RELATIONSHIPS',
			render: recommendedRelationshipRenderFunction
		},		
	];

	const recommendedConceptOptions = {
		xssSafe: true,
		Facets: [{
			'caption': ko.i18n('facets.caption.vocabulary', 'Vocabulary'),
			'binding': function (o) {
				return o.VOCABULARY_ID;
			}
		}, {
			'caption': ko.i18n('facets.caption.invalidReason', 'Invalid Reason'),
			'binding': function (o) {
				return o.INVALID_REASON_CAPTION;
			}
		}, {
			'caption': ko.i18n('facets.caption.class', 'Class'),
			'binding': function (o) {
				return o.CONCEPT_CLASS_ID;
			}
		}, {
			'caption': ko.i18n('facets.caption.domain', 'Domain'),
			'binding': function (o) {
				return o.DOMAIN_ID;
			}
		},{
			'caption': ko.i18n('facets.caption.recommendRelationship', 'Relationship'),
			'binding': function (o) {
				return o.RELATIONSHIPS;
			},
			'isArray': true
		}]
	};


	const getIncludedConceptsColumns = (context, commonUtils, selectAllFn) => [
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
			render: commonUtils.renderLink,
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
			title: ko.i18n('columns.rc', 'RC'),
			data: 'RECORD_COUNT',
			className: 'numeric'
		},
		{
			title: ko.i18n('columns.drc', 'DRC'),
			data: 'DESCENDANT_RECORD_COUNT',
			className: 'numeric'
		},
		{
			title: ko.i18n('columns.pc', 'PC'),
			data: 'PERSON_COUNT',
			className: 'numeric',
		},
		{
			title: ko.i18n('columns.dpc', 'DPC'),
			data: 'DESCENDANT_PERSON_COUNT',
			className: 'numeric',
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
			title: ko.i18n('columns.ancestors', 'Ancestors'),
			data: 'ANCESTORS',
			render: getAncestorsRenderFunction()
		},
	];

	const includedConceptsOptions = {
		xssSafe: true,
		autoWidth:false,
		Facets: [
			{
				'caption': ko.i18n('facets.caption.vocabulary', 'Vocabulary'),
				'binding': (o) => {
					return o.VOCABULARY_ID;
				}
			},
			{
				'caption': ko.i18n('facets.caption.class', 'Class'),
				'binding': (o) => {
					return o.CONCEPT_CLASS_ID;
				}
			},
			{
				'caption': ko.i18n('facets.caption.domain', 'Domain'),
				'binding': (o) => {
					return o.DOMAIN_ID;
				}
			},
			{
				'caption': ko.i18n('facets.caption.standardConcept', 'Standard Concept'),
				'binding': (o) => {
					return o.STANDARD_CONCEPT_CAPTION;
				}
			},
			{
				'caption': ko.i18n('facets.caption.invalidReason', 'Invalid Reason'),
				'binding': (o) => {
					return o.INVALID_REASON_CAPTION;
				}
			},
			{
				'caption': ko.i18n('facets.caption.hasRecords', 'Has Records'),
				'binding': (o) => {
					return parseInt(o.RECORD_COUNT) > 0;
				}
			},
			{
				'caption': ko.i18n('facets.caption.hasDescendantRecords', 'Has Descendant Records'),
				'binding': (o) => {
					return parseInt(o.DESCENDANT_RECORD_COUNT) > 0;
				}
			},
		]
	}


	function getIncludedConceptSetDrawCallback(columns, conceptSetStore) {
		return async function (settings) {
			if (settings.aoData) {
				const api = this.api();
				const rows = this.api().rows({page: 'current'});
				const data = rows.data();
				// The callback is called even when the table is not really populated with data.
				// In such case we would call API with set of NULLs which both doesn't make sense and breaks some DBs.
				// Therefore, we first check if there is real data to send to API.
				if (data[0] && data[0].CONCEPT_ID) {
					loadAndApplyAncestors(data, conceptSetStore).then(() => {
						const columnIndex = columns.findIndex(v => v.data === 'ANCESTORS');
						api.cells(null, columnIndex).invalidate();
						rows.nodes().each((element, index) => {
							const rowData = data[index];
							commonUtils.contextSensitiveLinkColor(element, rowData);
							const context = ko.contextFor(element);
							ko.cleanNode(element);
							ko.applyBindings(context, element);
						});
					});
				}
			}
		}
	}

	function getAncestorsModalHandler({ conceptSetStore, ancestors, ancestorsModalIsShown}) {
		return function(conceptId) {
			ancestors(conceptSetStore.includedConcepts()
				.find(v => v.CONCEPT_ID === conceptId)
				.ANCESTORS
				.map(v => ({concept: v})));
			if (!_.isEmpty(ancestors())) {
				ancestorsModalIsShown(true);
			}
		}
	}

	function getAncestorsRenderFunction() {
		return (s,p,d) => {
			if (d.ANCESTORS != null) {
				const tooltip = d.ANCESTORS.map(d => commonUtils.escapeTooltip(d.CONCEPT_NAME)).join('<br/>');
				return `<a data-bind="click: d => $parents[1].showAncestorsModal(d.CONCEPT_ID), tooltip: '${tooltip}'">${d.ANCESTORS.length}</a>`
			} else {
				return `<i class="fa fa-circle-notch fa-spin"></i>`;
			}
		};
	}
	
	async function loadSourceCodes(conceptSetStore) {
		conceptSetStore.loadingSourcecodes(true);

		// load mapped
		let identifiers = [];
		let concepts = conceptSetStore.includedConcepts();
		for (var i = 0; i < concepts.length; i++) {
			identifiers.push(concepts[i].CONCEPT_ID);
		}
		try {
			const { data } = await httpService.doPost(`${sharedState.vocabularyUrl()}lookup/mapped`, identifiers);
			const normalizedData = data.map(item => ({
				...item, 
				isSelected: ko.observable(false),
			}))
			conceptSetStore.includedSourcecodes(normalizedData);
			return data;
		} catch (err) {
			console.error(err);
		} finally {
			conceptSetStore.loadingSourcecodes(false);
		}
	}

	async function loadAncestors(ancestors, descendants) {
		const data = { ancestors, descendants };
		return httpService.doPost(sharedState.vocabularyUrl() + 'lookup/identifiers/ancestors', data);
	}

	function loadAndApplyAncestors(data, conceptSetStore) {
		const selectedConceptIds = conceptSetStore.current().expression.items().filter(v => !ko.unwrap(v.isExcluded)).map(v => v.concept.CONCEPT_ID);
		const ids = [];
		$.each(data, idx => {
			const element = data[idx];
			if (element.ANCESTORS==null) { // determine if we should lookukp ancetors, or default to []
				if (!conceptSetStore.selectedConceptsIndex()[element.CONCEPT_ID]) { // if not in the expression, look look up ancestors
					ids.push(element.CONCEPT_ID);
				} else { // else mark it as [] since it was included in the main expression
					element.ANCESTORS = []; // included concepts that came in from the expression are set to 0 ancestors
				}
			}
		});
		return new Promise((resolve, reject) => {
			if (!_.isEmpty(selectedConceptIds) && !_.isEmpty(ids)) {
				vocabularyService.loadAncestors(selectedConceptIds, ids).then(({ data: ancestors }) => {
					const map = conceptSetStore.includedConceptsMap();
					$.each(data, idx => {
						const line = data[idx];
						const ancArray = ancestors[line.CONCEPT_ID];
						if (line.ANCESTORS==null) {
							if (!_.isEmpty(ancArray)) {
								line.ANCESTORS = ancArray.map(conceptId => map[conceptId]).filter(Boolean);
							} else {
								line.ANCESTORS = [];
							}
						}
					});
					resolve();
				});
			} else {
				resolve();
			}
		});
	};

	async function loadIncluded(conceptSetStore) {
		const data = conceptSetStore.conceptSetInclusionIdentifiers();
		try {
			conceptSetStore.loadingIncluded(true);
			const response = await httpService.doPost(`${sharedState.vocabularyUrl()}lookup/identifiers`, data);
			await vocabularyService.loadDensity(response.data);
			conceptSetStore.includedConcepts((response.data || []).map(item => ({
				...item,
				ANCESTORS: [],
				isSelected: ko.observable(false)
			})));
			const map = response.data.reduce((result, item) => {
				result[item.CONCEPT_ID] = item;
				return result;
			}, {});
			conceptSetStore.includedConceptsMap(map);
			await loadAndApplyAncestors(conceptSetStore.includedConcepts(),conceptSetStore);
		} catch (err) {
			console.error(err);
		} finally {
			conceptSetStore.loadingIncluded(false);
		}
	}

	// attempt to only load concepts when tab is opened:  check for null values in the observable arrays,
	// indicating that the data requires reload.
	async function onCurrentConceptSetModeChanged(mode, conceptSetStore) {
		if (conceptSetStore.resolvingConceptSetExpression()) // do nothing
			return false;
		switch (mode) {
			case 'included-conceptsets':
			case 'included':
				conceptSetStore.includedConcepts() == null && await loadIncluded(conceptSetStore);
				break;
			case 'included-sourcecodes':
				await loadIncluded(conceptSetStore);
				if (conceptSetStore.includedSourcecodes() == null) {
					await loadSourcecodes(conceptSetStore);
				}
				break;
		}
	}		

	function createRepositoryConceptSet(conceptSetStore) {
		const newConceptSet = new ConceptSet({
			name: 'New Concept Set',
			id: 0
		});
		sharedState.RepositoryConceptSet.current(newConceptSet);
		conceptSetStore.current(sharedState.RepositoryConceptSet.current());
		conceptSetStore.isEditable(true);
	}

	function removeConceptsFromConceptSet({
		concepts = [],
		source,
	}) {
		const currentConceptSet = sharedState[`${source}ConceptSet`];
		const ids = concepts.map(({ concept }) => concept.CONCEPT_ID);
		const indexesFormRemoval = concepts.map(concept => concept.idx);
		ids.forEach(id => delete currentConceptSet.selectedConceptsIndex[id]);
		const selectedConcepts = currentConceptSet.selectedConcepts().filter(({ concept }, idx) => !indexesFormRemoval.includes(idx));

		currentConceptSet.selectedConcepts(selectedConcepts);
		currentConceptSet.selectedConcepts.valueHasMutated();
		resolveConceptSetExpression({ source });
	}

	function createConceptSetItem(concept) {
		return {
			concept: {
				CONCEPT_ID: concept.CONCEPT_ID,
				CONCEPT_NAME: concept.CONCEPT_NAME,
				STANDARD_CONCEPT: concept.STANDARD_CONCEPT,
				STANDARD_CONCEPT_CAPTION: concept.STANDARD_CONCEPT_CAPTION,
				INVALID_REASON: concept.INVALID_REASON,
				CONCEPT_CODE: concept.CONCEPT_CODE,
				DOMAIN_ID: concept.DOMAIN_ID,
				VOCABULARY_ID: concept.VOCABULARY_ID,
				CONCEPT_CLASS_ID: concept.CONCEPT_CLASS_ID,
			},
			isExcluded: concept.isExcluded,
			includeDescendants: concept.includeDescendants,
			includeMapped: concept.includeMapped,
		}
	}


	function addItemsToConceptSet({ items = [], conceptSetStore }) {
		if (!conceptSetStore.current()) {
			createRepositoryConceptSet(conceptSetStore);
		}
		const itemsToAdd = items.map(item => new ConceptSetItem(item));
		conceptSetStore.current().expression.items.push(...itemsToAdd);
		sharedState.activeConceptSet(conceptSetStore);
	}

  
  function getNextConceptSetId(conceptSets) {
    return conceptSets.length > 0 ? Math.max(...conceptSets.map(c => c.id)) + 1 : 0;
  }
  
  function newConceptSetHandler(conceptSets, context) {
    const newId = getNextConceptSetId(conceptSets());
    const newConceptSet = new ConceptSet({
      id: newId,
      name: "Unnamed Concept Set",
    });
    conceptSets([...conceptSets(), newConceptSet]);
    context.conceptSetId(newConceptSet.id);
    return newConceptSet.id;
  }

	function conceptSetSelectionHandler(conceptSets, context, selection, source) {

		return vocabularyService.getConceptSetExpression(selection.id, source.url).then((result) => {
			const newId = getNextConceptSetId(conceptSets());
			const newConceptSet = new ConceptSet({
				id: newId,
				name: selection.name,
				expression: result
			});
			conceptSets([...conceptSets(), newConceptSet]);
			context.conceptSetId(newConceptSet.id);
		});
	}

	function getPermissionsText(clause = false, action = 'edit') {
		return ko.unwrap(clause) ? null : ko.i18nformat('components.conceptSet.notEnoughPermissions', 'Not enough permissions to <%=action%> Concept Set', {action: action});
	}
	
  return {
    toRepositoryConceptSetItems,
		addItemsToConceptSet,
		createRepositoryConceptSet,
		removeConceptsFromConceptSet,
		recommendedConceptOptions,
		getRecommendedConceptColumns,
		includedConceptsOptions,		
		getIncludedConceptsColumns,
		getIncludedConceptSetDrawCallback,
		getAncestorsModalHandler,
		getAncestorsRenderFunction,
		loadSourceCodes,
		loadIncluded,
		loadAndApplyAncestors,
		onCurrentConceptSetModeChanged,
    newConceptSetHandler,
		conceptSetSelectionHandler,
		getPermissionsText,
  };
});