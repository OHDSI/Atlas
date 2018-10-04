define([
	'providers/CRUDService',
	'const',
], function (
	CRUDService,
	{ apiPaths },
) {

	class PathwayService extends CRUDService {	
		async listExecutions(id) {
			const { data } = await this.httpService.doGet(`${servicePath}/${id}/generation`);
			return data;
		}
	
		async getExecution(id) {
			const { data } = await httpService.doGet(`${servicePath}/generation/${id}`);
			return data;
		}
	
		async getResults(generationId) {
			const { data } = await httpService.doGet(`${servicePath}/generation/${generationId}/result`);
			return data;
		}
	
		async generate(id, sourcekey) {
			const { data } = await httpService.doPost(`${servicePath}/${id}/generation/${sourcekey}`);
			return data;
		}
		
		async loadExportDesign(id) {
			const { data } = await httpService.doGet(`${servicePath}/${id}/export`);
			return data;
		}
		
		async loadExportDesignByGeneration(generationId) {
			const { data } = await httpService.doGet(`${servicePath}/generation/${generationId}/design`);
			return data;
		}
		
		async importPathwayDesign(design) {
			const { data } = await httpService.doPost(`${servicePath}/import`, design);
			return data;
		}
	}


	return new PathwayService(apiPaths.pathway());
});