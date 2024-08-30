define([
	'appConfig',
	'services/http'],
function(
	appConfig,
	httpService
) {
	const ko = require('knockout');

	function getTools() {
		return httpService.doGet(appConfig.webAPIRoot + 'tool').then(({ data }) => data)
        .catch((err) => {
            alert(ko.i18n('tool.error.list', 'Get list tool error, try later !')());
        });
	}

    function updateTool(tool) {
        return httpService.doPut(appConfig.webAPIRoot + 'tool', tool)
        .catch((err) => {
            alert(ko.i18n('tool.error.update', 'Update tool error, try later !')());
        });
    }

    function createTool(tool){
        return httpService.doPost(appConfig.webAPIRoot + 'tool', tool)
        .catch((err) => {
            alert(ko.i18n('tool.error.create', 'Create tool error, try later !')());
        });
    }

    function deleteTool(id){
        return httpService.doDelete(appConfig.webAPIRoot + `tool/${id}`)
        .catch((err) => {
            alert(ko.i18n('tool.error.delete', 'Delete tool error, try later !')());
        });
    }

	return {
		getTools,
        updateTool,
        createTool,
        deleteTool
	}
});