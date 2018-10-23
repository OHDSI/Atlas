define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var d3 = require('d3');

	function getConceptRecordCount(sourceKey, conceptIds, results) {
		var densityPromise = $.Deferred();
		var densityIndex = {};

		for (c = 0; c < results.length; c++) {
			results[c].recordCount = '-';
			results[c].descendantRecordCount = '-';
		}

		$.ajax({
			url: config.webAPIRoot + 'cdmresults/' + sourceKey + '/conceptRecordCount',
			method: 'POST',
			contentType: 'application/json',
			timeout: 10000,
			data: JSON.stringify(conceptIds),
			success: function (entries) {
				var formatComma = d3.format(',');

				for (var e = 0; e < entries.length; e++) {
					densityIndex[Object.keys(entries[e])[0]] = Object.values(entries[e])[0];
				}

				for (var c = 0; c < results.length; c++) {
					var concept = results[c];
					if (densityIndex[concept.conceptId] != undefined) {
						concept.recordCount = formatComma(densityIndex[concept.conceptId][0]);
						concept.descendantRecordCount = formatComma(densityIndex[concept.conceptId][1]);
					} else {
						concept.recordCount = 0;
						concept.descendantRecordCount = 0;
					}
				}

				densityPromise.resolve();
			},
			error: function (error) {
				for (var c = 0; c < results.length; c++) {
					var concept = results[c];
					concept.recordCount = 'timeout';
					concept.descendantRecordCount = 'timeout';
				}

				densityPromise.resolve();
			}
		});

		return densityPromise;
	}

	var api = {
		getConceptRecordCount: getConceptRecordCount
	}

	return api;
});
