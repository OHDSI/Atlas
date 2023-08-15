define([
	'knockout',
	'./http',
  'appConfig',
	'services/AuthAPI',
], function (
	ko,
	httpService,
	config,
	authApi,
) {
	const servicePath = config.webAPIRoot + 'reusable';

	const PARAMETER_TYPE = {
		CONCEPT_SET: 'Concept Set',
	};

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
		design.data = ko.toJSON({
			type: design.type(),
			parameters: design.parameters(),
			conceptSets: design.conceptSets(),
			criteriaGroupExpression: design.criteriaGroupExpression,
			initialEventExpression: design.initialEventExpression,
			censoringEventExpression: design.censoringEventExpression,
		});
		let promise = httpService.doPost(servicePath, design).then(res => res.data);
		promise.then(authApi.refreshToken);
		return promise;
	}

	function exists(name, id) {
		return httpService.doGet(`${servicePath}/${id}/exists?name=${name}`).then(res => res.data);
	}

	function save(id, design) {
		design.data = ko.toJSON({
			type: design.type(),
			parameters: design.parameters(),
			conceptSets: design.conceptSets(),
			criteriaGroupExpression: design.criteriaGroupExpression,
			initialEventExpression: design.initialEventExpression,
			censoringEventExpression: design.censoringEventExpression,
		});
		return httpService.doPut(`${servicePath}/${id}`, design).then(res => res.data);
	}

	function copy(id) {
		let promise = httpService.doPost(`${servicePath}/${id}`).then(res => res.data);
		promise.then(authApi.refreshToken);
		return promise;
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
		PARAMETER_TYPE,
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