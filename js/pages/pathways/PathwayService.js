define([
    'services/http',
    'appConfig',
    'utils/ExecutionUtils',
		'services/AuthAPI',
], function (
	httpService,
	config,
  executionUtils,
	authApi
) {
	const servicePath = config.webAPIRoot + 'pathway-analysis';

	function list() {
		return httpService
			.doGet(servicePath + '?size=10000')
			.then(res => res.data);
	}

	async function create(design) {
		return authApi.executeWithRefresh(httpService.doPost(servicePath, design).then(res => res.data));
	}

	async function load(id) {
		return authApi.executeWithRefresh(httpService
			.doGet(`${servicePath}/${id}`)
			.then(res => res.data));
	}

	function save(id, design) {
		return httpService.doPut(`${servicePath}/${id}`, design).then(res => res.data);
	}

	async function copy(id) {
		return authApi.executeWithRefresh(httpService.doPost(`${servicePath}/${id}`).then(res => res.data));
	}

	function del(id) {
		return httpService
			.doDelete(`${servicePath}/${id}`)
			.then(res => res.data);
	}

	function listExecutions(id) {
		return httpService
			.doGet(`${servicePath}/${id}/generation`)
			.then(res => executionUtils.generateVersionTags(res.data));
	}

	function getExecution(id) {
		return httpService
			.doGet(`${servicePath}/generation/${id}`)
			.then(res => res.data);
	}

	function getResults(generationId) {
		return httpService
			.doGet(`${servicePath}/generation/${generationId}/result`)
			.then(res => res.data);
	}

	async function generate(id, sourcekey) {
		return authApi.executeWithRefresh(httpService
			.doPost(`${servicePath}/${id}/generation/${sourcekey}`)
			.then(res => res.data));
	}

	function cancelGeneration(id, sourceKey) {
		return httpService
			.doDelete(`${servicePath}/${id}/generation/${sourceKey}`)
			.then(res => res.data);
	}
	
	function loadExportDesign(id) {
		return httpService
			.doGet(`${servicePath}/${id}/export`)
			.then(res => res.data);
	}
	
	function loadExportDesignByGeneration(generationId) {
		return httpService
			.doGet(`${servicePath}/generation/${generationId}/design`)
			.then(res => res.data);
	}
	
	async function importPathwayDesign(design) {
		return authApi.executeWithRefresh(httpService
			.doPost(`${servicePath}/import`, design)
			.then(res => res.data));
	}

	function exists(name, id) {
		return httpService
			.doGet(`${servicePath}/${id}/exists?name=${name}`)
			.then(res => res.data);
	}

	function runDiagnostics(design) {
        return httpService
            .doPost(`${servicePath}/check`, design)
            .then(res => res.data);
	}

	function getVersions(id) {
		return httpService.doGet(`${servicePath}/${id}/version/`)
			.then(res => res.data);
	}

	function getVersion(id, versionNumber) {
		return httpService.doGet(`${servicePath}/${id}/version/${versionNumber}`)
			.then(res => res.data);
	}

	async function copyVersion(id, versionNumber) {
		return authApi.executeWithRefresh(httpService.doPut(`${servicePath}/${id}/version/${versionNumber}/createAsset`)
			.then(res => res.data));
	}

	function updateVersion(version) {
		return httpService.doPut(`${servicePath}/${version.assetId}/version/${version.version}`, {
			comment: version.comment,
			archived: version.archived
		}).then(res => res.data);
	}
	
	return {
		list,
		create,
		copy,
		load,
		save,
		del,
		listExecutions,
		getExecution,
		getResults,
		generate,
		cancelGeneration,
		loadExportDesign,
		loadExportDesignByGeneration,
		importPathwayDesign,
		exists,
        runDiagnostics,
		getVersions,
		getVersion,
		updateVersion,
		copyVersion
	};
});