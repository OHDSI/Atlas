define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');

	function getComparativeCohortAnalysisList() {
		var promise = $.ajax({
			url: config.api.url + 'comparativecohortanalysis',
			method: 'GET',
			contentType: 'application/json',
			error: function (error) {
				console.log("Error: " + error);
			}
		});
		return promise;
	}

	function getComparativeCohortAnalysis(id) {
		var promise = $.ajax({
			url: config.api.url + 'comparativecohortanalysis/' + id,
			method: 'GET',
			contentType: 'application/json',
			error: function (error) {
				console.log("Error: " + error);
			}
		});
		return promise;
	}

	function deleteAnalysis(analysisId) {
		var promise = $.ajax({
			url: config.api.url + 'comparativecohortanalysis/' + analysisId,
			method: 'DELETE',
			contentType: 'application/json',
			error: function (error) {
				console.log("Error: " + error);
			}
		});
		return promise;
	}

	function saveAnalysis(analysis) {
		var cca = analysis.jsonify();
		var json = JSON.stringify(cca);

		var promise = $.ajax({
			url: config.api.url + 'comparativecohortanalysis/' + (analysis.analysisId || ''),
			method: analysis.analysisId ? 'PUT' : 'POST',
			contentType: 'application/json',
			data: json,
			dataType: 'json',
			error: function (error) {
				console.log("Error: " + error);
			}
		});

		return promise;
	}

	var api = {
		deleteAnalysis: deleteAnalysis,
		getComparativeCohortAnalysis: getComparativeCohortAnalysis,
		getComparativeCohortAnalysisList: getComparativeCohortAnalysisList,
		saveAnalysis: saveAnalysis,
	}

	return api;
});
