define(function (require, exports) {

	var Service = require('providers/Service');
	var config = require('appConfig');

	class CohortFeaturesService extends Service {
		async getStudyDistributionStatistics(sourceKey, cohortId, domainList, analysisIdList, searchTerm, timeWindowList) {
			const url = `${config.webAPIRoot}featureextraction/query/distributions/${cohortId}/${sourceKey}`;
			const params = { sourceKey, cohortId, domainList, analysisIdList, searchTerm, timeWindowList };
			const { data } = await this.httpService.doGet(url, params);
			return data;
		}
		
		async getStudyPrevalenceStatistics(sourceKey, cohortId, domainList, analysisIdList, searchTerm, timeWindowList) {	
			const url = `${config.webAPIRoot}featureextraction/query/prevalence/${cohortId}/${sourceKey}`;
			const params = { sourceKey, cohortId, domainList, analysisIdList, searchTerm, timeWindowList };
			const { data } = await this.httpService.doGet(url, params);
			return data;			
		}
	
		async getStudyPrevalenceStatisticsByVocab(cohortId, sourceKey, covariateId) {
			const url = `${config.webAPIRoot}featureextraction/explore/prevalence/${cohortId}/${sourceKey}/${covariateId}`;
			const { data } = await this.httpService.doGet(url);
			return data;
		}
	}

	return new CohortFeaturesService();
});
