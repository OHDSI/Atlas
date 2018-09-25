define(function (require, exports) {

	const Service = require('providers/Service');
	const { apiPaths } = require('const');
	var d3 = require('d3');

	class CDMResultsService extends Service {
		async getConceptRecordCount(sourceKey, conceptIds, results) {
			var densityIndex = {};
	
			for (c = 0; c < results.length; c++) {
				results[c].recordCount = '-';
				results[c].descendantRecordCount = '-';
			}

			try {
				const { data: entries } = await this.httpService.doPost(`${apiPaths.cdmResults()}/${sourceKey}/conceptRecordCount`, conceptIds);
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

			} catch(error) {
				for (var c = 0; c < results.length; c++) {
					var concept = results[c];
					concept.recordCount = 'timeout';
					concept.descendantRecordCount = 'timeout';
				}
			}
		}

	}

	return new CDMResultsService();
});
