define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var d3 = require('d3');

	function getConceptRecordCountWithResultsUrl(resultsUrl, conceptIds, results, isCamelCaseProps = true, formatter = d3.format(',')) {

		const getConceptId = (concept) => isCamelCaseProps ? concept.conceptId : concept.CONCEPT_ID;
		const setRecordCount = (concept, val) => isCamelCaseProps ? (concept.recordCount = val) : (concept.RECORD_COUNT = val);
		const setDescendantRecordCount = (concept, val) => isCamelCaseProps ? (concept.descendantRecordCount = val) : (concept.DESCENDANT_RECORD_COUNT = val);
		const setPersonCount = (concept, val) => isCamelCaseProps ? (concept.personCount = val) : (concept.PERSON_COUNT = val);
		const setDescendantPersonCount = (concept, val) => isCamelCaseProps ? (concept.descendantPersonCount = val) : (concept.DESCENDANT_PERSON_COUNT = val);

		var densityPromise = $.Deferred();
		var densityIndex = {};

		for (c = 0; c < results.length; c++) {
			setRecordCount(results[c], 'loading');
			setDescendantRecordCount(results[c], 'loading');
			setPersonCount(results[c], 'loading');
			setDescendantPersonCount(results[c], 'loading');
		}

		$.ajax({
			url: resultsUrl + 'conceptRecordCount',
			method: 'POST',
			contentType: 'application/json',
			data: JSON.stringify(conceptIds),
			success: function (entries) {
				for (var e = 0; e < entries.length; e++) {
					densityIndex[Object.keys(entries[e])[0]] = Object.values(entries[e])[0];
				}

				for (var c = 0; c < results.length; c++) {
					var concept = results[c];
					if (densityIndex[getConceptId(concept)] != undefined) {
						setRecordCount(concept, formatter(densityIndex[getConceptId(concept)][0]));
						setDescendantRecordCount(concept, formatter(densityIndex[getConceptId(concept)][1]));
						setPersonCount(concept, formatter(densityIndex[getConceptId(concept)][2]));
						setDescendantPersonCount(concept, formatter(densityIndex[getConceptId(concept)][3]));
					} else {
						setRecordCount(concept, 0);
						setDescendantRecordCount(concept, 0);
						setPersonCount(concept, 0);
						setDescendantPersonCount(concept, 0);
					}
				}

				densityPromise.resolve();
			},
			error: function (error) {
				for (var c = 0; c < results.length; c++) {
					var concept = results[c];
					setRecordCount(concept, 'timeout');
					setDescendantRecordCount(concept, 'timeout');
					setPersonCount(concept, 'timeout');
					setDescendantPersonCount(concept, 'timeout');
				}

				densityPromise.resolve();
			}
		});

		return densityPromise;
	}

	function getConceptRecordCount(sourceKey, conceptIds, results, isCamelCaseProps = true, formatter = d3.format(',')) {
		return getConceptRecordCountWithResultsUrl(config.webAPIRoot + 'cdmresults/' + sourceKey + '/', conceptIds, results, isCamelCaseProps, formatter);
	}

	var api = {
		getConceptRecordCount: getConceptRecordCount,
		getConceptRecordCountWithResultsUrl: getConceptRecordCountWithResultsUrl,
	};

	return api;
});
