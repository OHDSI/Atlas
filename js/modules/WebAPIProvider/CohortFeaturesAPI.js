define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');

	function getStudyDistributionStatistics(sourceKey, cohortId, domainList, analysisIdList, searchTerm, timeWindowList) {
		var filterList = new Array();

		if (searchTerm != null) {
			filterList.push("searchTerm=" + searchTerm);
		}

		if (domainList != null) {
			$.each(domainList, function (i, val) {
				filterList.push("domain=" + val);
			});
		}

		if (analysisIdList != null) {
			$.each(analysisIdList, function (i, val) {
				filterList.push("analysisId=" + val);
			});
		}

		if (timeWindowList != null) {
			$.each(timeWindowList, function (i, val) {
				filterList.push("timeWindow=" + val);
			});
		}

		var url = `${config.webAPIRoot}featureextraction/query/distributions/${cohortId}/${sourceKey}`;
		if (filterList.length > 0) {
			url += "?" + filterList.join("&");
		}

		var promise = $.ajax({
			url: url,
			method: 'GET',
			contentType: 'application/json',
			error: function (error) {
				console.log("Error: " + error);
			}
		});

		return promise;
	}

	function getStudyPrevalenceStatistics(sourceKey, cohortId, domainList, analysisIdList, searchTerm, timeWindowList) {
		var filterList = new Array();

		if (searchTerm != null) {
			filterList.push("searchTerm=" + searchTerm);
		}

		if (domainList != null) {
			$.each(domainList, function (i, val) {
				filterList.push("domain=" + val);
			});
		}

		if (analysisIdList != null) {
			$.each(analysisIdList, function (i, val) {
				filterList.push("analysisId=" + val);
			});
		}

		if (timeWindowList != null) {
			$.each(timeWindowList, function (i, val) {
				filterList.push("timeWindow=" + val);
			});
		}

		var url = `${config.webAPIRoot}featureextraction/query/prevalence/${cohortId}/${sourceKey}`;
		if (filterList.length > 0) {
			url += "?" + filterList.join("&");
		}

		var promise = $.ajax({
			url: url,
			method: 'GET',
			contentType: 'application/json',
			error: function (error) {
				console.log("Error: " + error);
			}
		});

		return promise;
	}

	function getStudyPrevalenceStatisticsByVocab(cohortId, sourceKey, covariateId) {
		var url = `${config.webAPIRoot}featureextraction/explore/prevalence/${cohortId}/${sourceKey}/${covariateId}`;

		var promise = $.ajax({
			url: url,
			method: 'GET',
			contentType: 'application/json',
			error: function (error) {
				console.log("Error: " + error);
			}
		});

		return promise;
	}

	var api = {
		getStudyDistributionStatistics: getStudyDistributionStatistics,
		getStudyPrevalenceStatistics: getStudyPrevalenceStatistics,
		getStudyPrevalenceStatisticsByVocab: getStudyPrevalenceStatisticsByVocab,
	}

	return api;
});
