define(function (require, exports) {
	const ko = require('knockout');
	const httpService = require('services/http');
	const sharedState = require('atlas-state');
	const config = require('appConfig');
	const authApi = require('services/AuthAPI');
	const vocabularyService = require('services/Vocabulary');
	const commonUtils = require('utils/CommonUtils');
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

	function getAncestorsModalHandler({ sharedState, ancestors, ancestorsModalIsShown }) {
		return function(conceptId) {
			ancestors(sharedState.includedConcepts()
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

	function enhanceConceptSet(conceptSetItem) {
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
		return httpService.doPost(sharedState.vocabularyUrl() + 'lookup/identifiers', JSON.stringify(identifiers));
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

	async function loadSourcecodes() {
		sharedState.loadingSourcecodes(true);

		// load mapped
		let identifiers = [];
		let concepts = sharedState.includedConcepts();
		for (var i = 0; i < concepts.length; i++) {
			identifiers.push(concepts[i].CONCEPT_ID);
		}
		try {
			const { data } = await httpService.doPost(`${sharedState.vocabularyUrl()}lookup/mapped`, identifiers);
			sharedState.includedSourcecodes(data);
			return data;
		} catch (err) {
			console.error(err);
		} finally {
			sharedState.loadingSourcecodes(false);
		}
	}

	async function onCurrentConceptSetModeChanged(newMode) {
		let hashcode;
		const loadIncludedWithHash = async function() {
			hashcode = hash(sharedState.conceptSetInclusionIdentifiers());
			if (hashcode !== sharedState.includedHash()) {
				await loadIncluded();
				sharedState.includedHash(hashcode);
			}
		};
		switch (newMode) {
			case 'included-conceptsets':
			case 'included':
				await loadIncludedWithHash();
				break;
			case 'included-sourcecodes':
				await loadIncludedWithHash();
				if (sharedState.includedSourcecodes().length === 0) {
					await loadSourcecodes();
				}
				break;
		}
	}

	async function loadAncestors(ancestors, descendants) {
		const data = { ancestors, descendants };
		return httpService.doPost(sharedState.vocabularyUrl() + 'lookup/identifiers/ancestors', data);
	}

	function loadAndApplyAncestors(data) {
		const selectedConceptIds = sharedState.selectedConcepts().filter(v => !v.isExcluded()).map(v => v.concept.CONCEPT_ID);
		const ids = [];
		$.each(data, idx => {
			const element = data[idx];
			if (_.isEmpty(element.ANCESTORS) && sharedState.selectedConceptsIndex[element.CONCEPT_ID] !== 1) {
				ids.push(element.CONCEPT_ID);
			}
		});
		return new Promise((resolve, reject) => {
			if (!_.isEmpty(selectedConceptIds) && !_.isEmpty(ids)) {
				loadAncestors(selectedConceptIds, ids).then(({ data: ancestors }) => {
					const map = sharedState.includedConceptsMap();
					$.each(data, idx => {
						const line = data[idx];
						const ancArray = ancestors[line.CONCEPT_ID];
						if (!_.isEmpty(ancArray) && _.isEmpty(line.ANCESTORS)) {
							line.ANCESTORS = ancArray.map(conceptId => map[conceptId]);
						}
					});
					resolve();
				});
			} else {
				resolve();
			}
		});
	};

	async function loadIncluded(identifiers) {
		const data = identifiers || sharedState.conceptSetInclusionIdentifiers();
		try {
			sharedState.loadingIncluded(true);
			const response = await httpService.doPost(`${sharedState.vocabularyUrl()}lookup/identifiers`, data);
			await vocabularyService.loadDensity(response.data);
			sharedState.includedConcepts((response.data || []).map(v => ({...v, ANCESTORS: []})));
			const map = response.data.reduce((result, item) => {
				result[item.CONCEPT_ID] = item;
				return result;
			}, {});
			sharedState.includedConceptsMap(map);
			await loadAndApplyAncestors(sharedState.includedConcepts());
		} catch (err) {
			console.error(err);
		} finally {
			sharedState.loadingIncluded(false);
		}
	}

	function setConceptSet(conceptset, expressionItems) {
		var conceptSetItemsToAdd = [];
		expressionItems.forEach((conceptSet) => {
			const conceptSetItem = enhanceConceptSet(conceptSet);

			sharedState.selectedConceptsIndex[conceptSetItem.concept.CONCEPT_ID] = 1;
			conceptSetItemsToAdd.push(conceptSetItem);
		});

		sharedState.selectedConcepts(conceptSetItemsToAdd);
		sharedState.ConceptSet.current({
			name: ko.observable(conceptset.name),
			id: conceptset.id
		});
	}

	function setConceptSetExpressionExportItems() {
		var highlightedJson = commonUtils.syntaxHighlight(sharedState.conceptSetExpression());
		sharedState.currentConceptSetExpressionJson(highlightedJson);
		var conceptIdentifierList = [];
		for (var i = 0; i < sharedState.selectedConcepts().length; i++) {
			conceptIdentifierList.push(sharedState.selectedConcepts()[i].concept.CONCEPT_ID);
		}
		sharedState.currentConceptIdentifierList(conceptIdentifierList.join(','));
	}

	// for the current selected concepts:
	// update the export panel
	// resolve the included concepts and update the include concept set identifier list
	function resolveConceptSetExpression(resolveAgainstServer = true) {
		let hashCode = hash(sharedState.conceptSetInclusionIdentifiers());
		if (hashCode !== sharedState.includedHash()) {
			sharedState.includedConcepts.removeAll();
			sharedState.includedSourcecodes.removeAll();
			sharedState.conceptSetInclusionIdentifiers.removeAll();
			sharedState.currentConceptIdentifierList(null);
			sharedState.currentIncludedConceptIdentifierList(null);
		}
		setConceptSetExpressionExportItems(sharedState.conceptSetExpression());
		return resolveAgainstServer ? resolveConceptSetExpressionSimple(sharedState.conceptSetExpression()) : null;
	}

	function resolveConceptSetExpressionSimple(expression, success) {
		const callback = typeof success === 'function'
			? success
			: ({ data }) => {
				let info = data;
				if (!Array.isArray(info)) {
					throw new Error();
				}
				sharedState.conceptSetInclusionIdentifiers(info);
				sharedState.currentIncludedConceptIdentifierList(info.join(','));
			};
		sharedState.resolvingConceptSetExpression(true);
		const resolvingPromise = httpService.doPost(sharedState.vocabularyUrl() + 'resolveConceptSetExpression', expression)
			.then(callback)
			.then(() => sharedState.resolvingConceptSetExpression(false))

		return resolvingPromise;
	}

	function clearConceptSet() {
		sharedState.ConceptSet.current(null);
		sharedState.clearSelectedConcepts();
		resolveConceptSetExpression(false);
		sharedState.ConceptSet.dirtyFlag().reset();
	}

	const api = {
		getIncludedConceptSetDrawCallback: getIncludedConceptSetDrawCallback,
		getAncestorsModalHandler: getAncestorsModalHandler,
		getAncestorsRenderFunction: getAncestorsRenderFunction,
		enhanceConceptSet,
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