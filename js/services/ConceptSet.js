define(function (require, exports) {

	const ko = require('knockout');
	const httpService = require('services/http');
	const sharedState = require('atlas-state');
	const config = require('appConfig');

	function getIncludedConceptSetDrawCallback({ model, searchConceptsColumns }) {
		return async function (settings) {
			if (settings.aoData) {
				const api = this.api();
				const rows = this.api().rows({page: 'current'});
				const data = rows.data();
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
		return (s, p, d) => `<a data-bind="click: function() {$parents[1].showAncestorsModal(${d.CONCEPT_ID});}, tooltip: '${d.ANCESTORS.map(d => d.CONCEPT_NAME).join('<br>')}'" class="clickable">${d.ANCESTORS.length}</a>`;
	}

	function enchanceConceptSet(conceptSetItem) {
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
		return httpService.doGet(config.api.url + 'conceptset/' + conceptSetId + '/expression').then(({data}) => data);
	}

	function lookupIdentifiers(identifiers) {
		return httpService.doPost(sharedState.vocabularyUrl() + 'lookup/identifiers', JSON.stringify(identifiers));
	}

	const api = {
		getIncludedConceptSetDrawCallback: getIncludedConceptSetDrawCallback,
		getAncestorsModalHandler: getAncestorsModalHandler,
		getAncestorsRenderFunction: getAncestorsRenderFunction,
		enchanceConceptSet,
		loadConceptSet,
		loadConceptSetExpression,
		lookupIdentifiers,
	};

	return api;
});