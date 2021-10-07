define([
    'services/http',
    'appConfig',
], function (
	httpService,
	config,
) {
	const servicePath = config.webAPIRoot + 'reusable';

	function list() {
		return httpService
			.doGet(servicePath + '?size=10000')
			.then(res => res.data);
	}

	function load(id) {
		return httpService
			.doGet(`${servicePath}/${id}`)
			.then(res => res.data);
	}

	function create(design) {
		return request = httpService.doPost(servicePath, design).then(res => res.data);
	}

	function exists(name, id) {
		return httpService.doGet(`${servicePath}/${id}/exists?name=${name}`).then(res => res.data);
	}

	function save(id, design) {
		return httpService.doPut(`${servicePath}/${id}`, design).then(res => res.data);
	}

	function copy(id) {
		return httpService.doPost(`${servicePath}/${id}`).then(res => res.data);
	}

	function del(id) {
		return httpService
			.doDelete(`${servicePath}/${id}`)
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

	function copyVersion(id, versionNumber) {
		return httpService.doPut(`${servicePath}/${id}/version/${versionNumber}/createAsset`)
			.then(res => res.data);
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
		exists,
		copy,
		load,
		save,
		del,
		getVersions,
		getVersion,
		updateVersion,
		copyVersion
	};
});