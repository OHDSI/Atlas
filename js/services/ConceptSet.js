define(function (require, exports) {
	const ko = require('knockout');
	const httpService = require('services/http');
	const sharedState = require('atlas-state');
	const config = require('appConfig');
	const authApi = require('services/AuthAPI');
	function getIncludedConceptSetDrawCallback({ model, searchConceptsColumns }) {
		return async function (settings) {
			if (settings.aoData) {
				const api = this.api();
				const rows = this.api().rows({page: 'current'});
				const data = rows.data();
				// The callback is called even when the table is not really populated with data.
				// In such case we would call API with set of NULLs which both doesn't make sense and breaks some DBs.
				// Therefore, we first check if there is real data to send to API.
				if (data[0] && data[0].CONCEPT_ID) {
					await model.loadAndApplyAncestors(data);
					const columnIndex = searchConceptsColumns.findIndex(v => v.data === 'ANCESTORS');
					api.cells(null, columnIndex).invalidate();
					rows.nodes().each((element, index) => {
						const rowData = data[index];
						model.contextSensitiveLinkColor(element, rowData);
						const context = ko.contextFor(element);
						ko.cleanNode(element);
						ko.applyBindings(context, element);
					})
				}
			}
		}
	}

	function getAncestorsModalHandler({ model, ancestors, ancestorsModalIsShown }) {
		return function(conceptId) {
			ancestors(model.includedConcepts()
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
			const tooltip = d.ANCESTORS.map(d => d.CONCEPT_NAME).join('<br>');
			return `<a data-bind="click: d => $parents[1].showAncestorsModal(d.CONCEPT_ID), tooltip: \`${tooltip}\`">${d.ANCESTORS.length}</a>`
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
	};

	return api;
});