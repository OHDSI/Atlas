define([
	'appConfig',
	'services/http'],
function(
	appConfig,
	httpService
) {

	const ISSUES_PAGE_SIZE = 10;

	function getTools() {
		return httpService.doGet(appConfig.webAPIRoot + 'tool').then(({ data }) => data);
	}

    function updateTool(tool) {
        return httpService.doPut(appConfig.webAPIRoot + 'tool', tool);
    }

    function createTool(tool){
        return httpService.doPost(appConfig.webAPIRoot + 'tool', tool);
    }

    function deleteTool(id){
        return httpService.doDelete(appConfig.webAPIRoot + `tool/${id}`);
    }

	return {
		getTools,
        updateTool,
        createTool,
        deleteTool
	}
});