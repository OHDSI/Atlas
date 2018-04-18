define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var authApi = require('webapi/AuthAPI');
	var sharedState = require('atlas-state');
	var ko = require('knockout');

	function getGenerationInfo(conceptSetId) {
		var infoPromise = $.ajax({
			url: config.webAPIRoot + 'conceptset/' + + (conceptSetId || '-1') + '/generationinfo',
			error: authApi.handleAccessDenied,
		});
		return infoPromise;
	}
	
	function deleteConceptSet(conceptSetId) {
		var promise = $.ajax({
			url: config.webAPIRoot + 'conceptset/' + (conceptSetId || '-1') ,
			method: 'DELETE',
			contentType: 'application/json',
			error: authApi.handleAccessDenied,
		});
		return promise;
	}

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
					ko.applyBindings(context.createChildContext(rowData), element);
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
		return (s, p, d) => `<a data-bind="click: function() {$parents[2].showAncestorsModal(${d.CONCEPT_ID});}, tooltip: '${d.ANCESTORS.map(d => d.CONCEPT_NAME).join('<br>')}'" class="clickable">${d.ANCESTORS.length}</a>`;
		
	}

	const api = {
		getGenerationInfo: getGenerationInfo, 
		deleteConceptSet: deleteConceptSet,
		getIncludedConceptSetDrawCallback: getIncludedConceptSetDrawCallback,
		getAncestorsModalHandler: getAncestorsModalHandler,
		getAncestorsRenderFunction: getAncestorsRenderFunction,
	};

	return api;
});