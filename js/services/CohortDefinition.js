define(function (require, exports) {

	var config = require('appConfig');
	const CRUDService = require('providers/CRUDService');
	const constants = require('const');
	
	class CohortDefinitionService extends CRUDService {
		async copy(id) {
			const { data } = await this.httpService.doGet(`${this.baseUrl}/${id}/copy`);
			return data;
		}

		async getSql(expression, options) {
			const { data } = await this.httpService.doPost(`${this.baseUrl}/sql`, { expression, options });
			return data;
		}

		async generate(cohortDefinitionId = -1, sourceKey) {
			const { data } = await this.httpService.doGet(`${this.baseUrl}/${cohortDefinitionId}/generate/${sourceKey}`);
			return data;
		}
		
		async cancelGenerate(cohortDefinitionId = -1, sourceKey) {
			const { data } = await this.httpService.doGet(`${this.baseUrl}/${cohortDefinitionId}/cancel/${sourceKey}`);
			return data;
		}

		async getInfo(cohortDefinitionId = -1) {
			const { data } = await this.httpService.doGet(`${this.baseUrl}/${cohortDefinitionId}/info`);
			return data;
		}

		async getReport(cohortDefinitionId = -1, sourceKey, mode = 0) {
			const { data } = await this.httpService.doGet(`${this.baseUrl}/${cohortDefinitionId}/report/${sourceKey}`, { mode });
			return data;
		}
		
		async getWarnings(cohortDefinitionId = -1) {
			const { data } = await this.httpService.doGet(`${this.baseUrl}/${cohortDefinitionId}/check`);
			return data;
		}
		
		async runDiagnostics(cohortDefinitionId = -1, expression) {
			const { data } = await this.httpService.doPost(`${this.baseUrl}/${cohortDefinitionId}/check`, expression);
			return data;
		}
		
		async getCohortCount(cohortDefinitionId = -1, sourceKey) {
			const { data } = await this.httpService.doGet(config.api.url + 'cohortresults/' + sourceKey + '/' + cohortDefinitionId + '/distinctPersonCount');
			return data;
		}
	}	
	
	return new CohortDefinitionService(constants.apiPaths.cohortDefinition());
});
