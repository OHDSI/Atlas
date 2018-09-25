define(function (require, exports) {

	var ko = require('knockout');
	const CRUDService = require('providers/CRUDService');
	const { apiPaths } = require('const');

	function parse(data) {
		return Object.assign(data, {
			expression: JSON.parse(data.expression),
		});
	}

	class IRAnalysisService extends CRUDService {
		async save(definition) {
			var definitionCopy = JSON.parse(ko.toJSON(definition));			
			if (typeof definitionCopy.expression != 'string') {
				definitionCopy.expression = JSON.stringify(definitionCopy.expression);
			}

			return await super.save(definitionCopy);
		}

		async copy(id) {
			const response = await super.copy(id);
			return parse(response);
		}

		async execute(id, sourceKey) {
			return await this.httpService.doGet(`${this.baseUrl}/${id}/execute/${sourceKey}`);
		}

		async getInfo(id = '') {
			const { data } = await this.httpService.doGet(`${this.baseUrl}/${id}/info`);
			return data;
		}
		
		async deleteInfo(id, sourceKey) {
			return await this.httpService.doDelete(`${this.baseUrl}/${id}/info/${sourceKey}`);
		}

		async getReport(id, sourceKey, targetId, outcomeId) {
			const { data } = await this.httpService.doGet(`${this.baseUrl}/${id}/report/${sourceKey}`, { targetId, outcomeId });
			return data;
		}	
	}
	
	return new IRAnalysisService(apiPaths.ir());
});