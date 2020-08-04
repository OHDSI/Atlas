define(function (require, exports) {
	const ko = require('knockout');
	const httpService = require('services/http');
	const sharedState = require('atlas-state');
	const config = require('appConfig');
	const authApi = require('services/AuthAPI');
	const vocabularyService = require('services/Vocabulary');
	const commonUtils = require('utils/CommonUtils');
	const globalConstants = require('const');
	const _ = require('lodash');
	const hash = require('hash-it').default;
	function getIncludedConceptSetDrawCallback({ searchConceptsColumns }) {
		return async function (settings) {
			if (settings.aoData) {
				const api = this.api();
				const rows = this.api().rows({page: 'current'});
				const data = rows.data();
				// The callback is called even when the table is not really populated with data.
				// In such case we would call API with set of NULLs which both doesn't make sense and breaks some DBs.
				// Therefore, we first check if there is real data to send to API.
				if (data[0] && data[0].CONCEPT_ID) {
					await loadAndApplyAncestors(data);
					const columnIndex = searchConceptsColumns.findIndex(v => v.data === 'ANCESTORS');
					api.cells(null, columnIndex).invalidate();
					rows.nodes().each((element, index) => {
						const rowData = data[index];
						commonUtils.contextSensitiveLinkColor(element, rowData);
						const context = ko.contextFor(element);
						ko.cleanNode(element);
						ko.applyBindings(context, element);
					})
				}
			}
		}
	}

	function getAncestorsModalHandler({ sharedState, ancestors, ancestorsModalIsShown, source }) {
		return function(conceptId) {
			ancestors(sharedState[`${source}ConceptSet`].includedConcepts()
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
			const tooltip = d.ANCESTORS.map(d => commonUtils.escapeTooltip(d.CONCEPT_NAME)).join('\n');
			return `<a data-bind="click: d => $parents[1].showAncestorsModal(d.CONCEPT_ID), tooltip: '${tooltip}'">${d.ANCESTORS.length}</a>`
		};
	}

	function enhanceConceptSetItem(conceptSetItem) {
		return {
			...conceptSetItem,
			isExcluded: ko.observable(conceptSetItem.isExcluded),
			includeDescendants: ko.observable(conceptSetItem.includeDescendants),
			includeMapped: ko.observable(conceptSetItem.includeMapped),
		};
	}

	function loadConceptSet(id) {
		return httpService.doGet(config.api.url + 'conceptset/' + id).then(({ data }) => data);
	}

	function loadConceptSetExpression(conceptSetId) {
		return httpService.doGet(config.api.url + 'conceptset/' + conceptSetId + '/expression').then(({ data }) => data);
	}

	function lookupIdentifiers(identifiers) {
		return httpService.doPost(sharedState.vocabularyUrl() + 'lookup/identifiers', identifiers);
	}

	function getInclusionCount(expression) {
		const data = { items: ko.toJS(expression), };
		return httpService.doPost(sharedState.vocabularyUrl() + 'included-concepts/count', data);
	}

	function getGenerationInfo(conceptSetId) {
		return httpService.doGet(config.webAPIRoot + 'conceptset/' + + (conceptSetId || '-1') + '/generationinfo')
			.then(({ data }) => data)
			.catch(authApi.handleAccessDenied);
	}

    function deleteConceptSet(conceptSetId) {
		return httpService.doDelete(config.webAPIRoot + 'conceptset/' + (conceptSetId || '-1'))
			.catch(authApi.handleAccessDenied);
    }

  function exists(name, id) {
		return httpService.doGet(`${config.webAPIRoot}conceptset/${id}/exists?name=${name}`)
			.then(({ data }) => data);
  }

  function saveConceptSet(conceptSet) {
		let promise = new Promise(r => r());
		const url = `${config.api.url}conceptset/${conceptSet.id ? conceptSet.id : ''}`;
		if (conceptSet.id) {
			promise = httpService.doPut(url, conceptSet);
		} else {
			promise = httpService.doPost(url, conceptSet);
		}
		promise.catch(authApi.handleAccessDenied);

		return promise;
	}

	function saveConceptSetItems(id, conceptSetItems) {
		return httpService.doPut(config.api.url + 'conceptset/' + id + '/items', conceptSetItems)
			.catch(authApi.handleAccessDenied);
	}

	function getConceptSet(conceptSetId) {
		return httpService.doGet(config.webAPIRoot + 'conceptset/' + (conceptSetId || '-1'))
			.catch(authApi.handleAccessDenied);
	}

	function getCopyName(id) {
		return httpService.doGet(config.webAPIRoot + 'conceptset/' + (id || "") + "/copy-name")
			.then(({ data }) => data);
	}

	async function loadSourcecodes({ source }) {
		const currentConceptSet = sharedState[`${source}ConceptSet`];
		currentConceptSet.loadingSourcecodes(true);

		// load mapped
		let identifiers = [];
		let concepts = currentConceptSet.includedConcepts();
		for (var i = 0; i < concepts.length; i++) {
			identifiers.push(concepts[i].CONCEPT_ID);
		}
		try {
			const { data } = await httpService.doPost(`${sharedState.vocabularyUrl()}lookup/mapped`, identifiers);
			const normalizedData = data.map(item => ({
				...item, 
				isSelected: ko.observable(false),
			}))
			currentConceptSet.includedSourcecodes(normalizedData);
			return data;
		} catch (err) {
			console.error(err);
		} finally {
			currentConceptSet.loadingSourcecodes(false);
		}
	}

	async function onCurrentConceptSetModeChanged({ mode, source }) {
		const currentConceptSet = sharedState[`${source}ConceptSet`];
		let hashcode;
		const loadIncludedWithHash = async function() {
			hashcode = hash(currentConceptSet.conceptSetInclusionIdentifiers());
			// if (hashcode !== currentConceptSet.includedHash()) { TODO
				await loadIncluded({ source });
				currentConceptSet.includedHash(hashcode);
			// }
		};
		switch (mode) {
			case 'included-conceptsets':
			case 'included':
				await loadIncludedWithHash();
				break;
			case 'included-sourcecodes':
				await loadIncludedWithHash();
				if (currentConceptSet.includedSourcecodes().length === 0) {
					await loadSourcecodes({ source });
				}
				break;
		}
	}

	async function loadAncestors(ancestors, descendants) {
		const data = { ancestors, descendants };
		return httpService.doPost(sharedState.vocabularyUrl() + 'lookup/identifiers/ancestors', data);
	}

	function loadAndApplyAncestors({ data, source }) {
		const currentConceptSet = sharedState[`${source}ConceptSet`];
		const selectedConceptIds = currentConceptSet.selectedConcepts().filter(v => !ko.unwrap(v.isExcluded)).map(v => v.concept.CONCEPT_ID);
		const ids = [];
		$.each(data, idx => {
			const element = data[idx];
			if (_.isEmpty(element.ANCESTORS) && !currentConceptSet.selectedConceptsIndex[element.CONCEPT_ID]) {
				ids.push(element.CONCEPT_ID);
			}
		});
		return new Promise((resolve, reject) => {
			if (!_.isEmpty(selectedConceptIds) && !_.isEmpty(ids)) {
				loadAncestors(selectedConceptIds, ids).then(({ data: ancestors }) => {
					const map = currentConceptSet.includedConceptsMap();
					$.each(data, idx => {
						const line = data[idx];
						const ancArray = ancestors[line.CONCEPT_ID];
						if (!_.isEmpty(ancArray) && _.isEmpty(line.ANCESTORS)) {
							line.ANCESTORS = ancArray.map(conceptId => map[conceptId]).filter(Boolean);
						}
					});
					resolve();
				});
			} else {
				resolve();
			}
		});
	};

	async function loadIncluded({
		identifiers,
		source,
	}) {
		const currentConceptSet = sharedState[`${source}ConceptSet`];
		const data = identifiers || currentConceptSet.conceptSetInclusionIdentifiers();
		try {
			currentConceptSet.loadingIncluded(true);
			const response = await httpService.doPost(`${sharedState.vocabularyUrl()}lookup/identifiers`, data);
			await vocabularyService.loadDensity(response.data);
			currentConceptSet.includedConcepts((response.data || []).map(item => ({
				...item,
				ANCESTORS: [],
				isSelected: ko.observable(false)
			})));
			const map = response.data.reduce((result, item) => {
				result[item.CONCEPT_ID] = item;
				return result;
			}, {});
			currentConceptSet.includedConceptsMap(map);
			await loadAndApplyAncestors({
				data: currentConceptSet.includedConcepts(),
				source,
			});
		} catch (err) {
			console.error(err);
		} finally {
			currentConceptSet.loadingIncluded(false);
		}
	}

	function setConceptSet(conceptset, expressionItems, source) {
		let conceptSetItemsToAdd = [];
		const currentConceptSet = sharedState[`${source}ConceptSet`];
		expressionItems.forEach(item => {
			const conceptSetItem = enhanceConceptSetItem(item);
			currentConceptSet.selectedConceptsIndex[conceptSetItem.concept.CONCEPT_ID] = {
				isExcluded: conceptSetItem.isExcluded,
				includeDescendants: conceptSetItem.includeDescendants,
				includeMapped: conceptSetItem.includeMapped,
			};
			conceptSetItemsToAdd.push(conceptSetItem);
		});
		currentConceptSet.selectedConcepts(conceptSetItemsToAdd);
		currentConceptSet.current({
			name: ko.observable(conceptset.name),
			id: conceptset.id,
			createdBy: conceptset.createdBy,
			createdDate: conceptset.createdDate,
			modifiedBy: conceptset.modifiedBy,
			modifiedDate: conceptset.modifiedDate,
		});
	}

	function setConceptSetExpressionExportItems({
		source,
	}) {
		const currentConceptSet = sharedState[`${source}ConceptSet`];
		const selectedConcepts = currentConceptSet.selectedConcepts().map(({ idx, ...item }) => item);
		const conceptSetExpression = { items: selectedConcepts };
		const highlightedJson = commonUtils.syntaxHighlight(conceptSetExpression);
		currentConceptSet.currentConceptSetExpressionJson(highlightedJson);
		let conceptIdentifierList = [];
		for (let i = 0; i < currentConceptSet.selectedConcepts().length; i++) {
			conceptIdentifierList.push(currentConceptSet.selectedConcepts()[i].concept.CONCEPT_ID);
		}
		currentConceptSet.currentConceptIdentifierList(conceptIdentifierList.join(','));
	}



	// for the current selected concepts:
	// update the export panel
	// resolve the included concepts and update the include concept set identifier list
	function resolveConceptSetExpression({
		resolveAgainstServer = true,
		source,
	}) {
		const currentConceptSet = sharedState[`${source}ConceptSet`];
		['includedConcepts', 'includedSourcecodes', 'conceptSetInclusionIdentifiers']
			.forEach(key => currentConceptSet[key].removeAll());
		['currentConceptIdentifierList', 'currentIncludedConceptIdentifierList']
			.forEach(key => currentConceptSet[key](null));
		
		setConceptSetExpressionExportItems({ source });
		return resolveAgainstServer
			? resolveConceptSetExpressionSimple({ source })
			: null;
	}

	function resolveConceptSetExpressionSimple({
		successCallback,
		source,
	}) {
		const currentConceptSet = sharedState[`${source}ConceptSet`];
		const callback = typeof successCallback === 'function'
			? success
			: ({ data }) => {
				let info = data;
				if (!Array.isArray(info)) {
					throw new Error();
				}
				currentConceptSet.conceptSetInclusionIdentifiers(info);
				currentConceptSet.currentIncludedConceptIdentifierList(info.join(','));
			};
			currentConceptSet.resolvingConceptSetExpression(true);
			const conceptSetExpression = { items: currentConceptSet.selectedConcepts() };
			const resolvingPromise = httpService.doPost(sharedState.vocabularyUrl() + 'resolveConceptSetExpression', conceptSetExpression)
				.then(callback)
				.then(() => currentConceptSet.resolvingConceptSetExpression(false));
			
			return resolvingPromise;
	}

	function clearConceptSet({ source }) {
		const conceptSetKey = `${source}ConceptSet`;
		sharedState[conceptSetKey].current(null);
		sharedState.clearSelectedConcepts({ source });
		resolveConceptSetExpression({ resolveAgainstServer: false, source });
		sharedState[conceptSetKey].dirtyFlag().reset();
	}

	function addToConceptSetIdsMap({ concepts = [], source }) {
		const currentConceptSet = sharedState[`${source}ConceptSet`];
		const selectedConceptsIndex = concepts.reduce((p, c) => ({ ...p, [c.concept.CONCEPT_ID]: {
			includeDescendants: c.includeDescendants,
			includeMapped: c.includeMapped,
			isExcluded: c.isExcluded,
		} }), {});
		currentConceptSet.selectedConceptsIndex = {
			...currentConceptSet.selectedConceptsIndex,
			...selectedConceptsIndex,
		};
	}

	function createNewConceptSet(currentConceptSet) {
		const conceptSet = {
			id: 0,
			name: ko.observable("New Concept Set"),
		};
		currentConceptSet.current(conceptSet);
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


	function addConceptsToConceptSet({ concepts = [], source }) {
		const currentConceptSet = sharedState[`${source}ConceptSet`];
		if (!currentConceptSet.current()) {
			createNewConceptSet(currentConceptSet);
		}
		const normalizedConcepts = concepts.map(concept => createConceptSetItem(concept));
		addToConceptSetIdsMap({ concepts: normalizedConcepts, source });
		const selectedConcepts = [
			...currentConceptSet.selectedConcepts(),
			...normalizedConcepts
		];
		currentConceptSet.selectedConcepts(selectedConcepts);
		currentConceptSet.selectedConcepts.valueHasMutated();
		setConceptSetExpressionExportItems({ source });
		sharedState.activeConceptSet(sharedState[`${source}ConceptSet`]);
	}

	const api = {
		addConceptsToConceptSet,
		addToConceptSetIdsMap,
		removeConceptsFromConceptSet,
		getIncludedConceptSetDrawCallback: getIncludedConceptSetDrawCallback,
		getAncestorsModalHandler: getAncestorsModalHandler,
		getAncestorsRenderFunction: getAncestorsRenderFunction,
		enhanceConceptSetItem,
		loadConceptSet,
		loadConceptSetExpression,
		lookupIdentifiers,
		getInclusionCount,
		getCopyName: getCopyName,
		getConceptSet: getConceptSet,
		getGenerationInfo: getGenerationInfo,
		deleteConceptSet: deleteConceptSet,
		exists: exists,
		saveConceptSet,
		saveConceptSetItems,
		loadSourcecodes,
		onCurrentConceptSetModeChanged,
		loadIncluded,
		setConceptSet,
		setConceptSetExpressionExportItems,
		resolveConceptSetExpression,
		resolveConceptSetExpressionSimple,
		clearConceptSet,
	};

	return api;
});