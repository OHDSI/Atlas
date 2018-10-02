define([
    'webapi/AuthAPI',
], function (
	AuthAPI,
) {

	function isPermittedCreate() {
		return AuthAPI.isPermitted(`pathway-analysis:post`);
	}

	function isPermittedImport() {
		return AuthAPI.isPermitted(`pathway-analysis:import:post`);
	}

	function isPermittedList() {
		return AuthAPI.isPermitted(`pathway-analysis:get`);
	}

	function isPermittedLoad(id) {
		return AuthAPI.isPermitted(`pathway-analysis:${id}:get`);
	}

	function isPermittedUpdate(id) {
		return AuthAPI.isPermitted(`pathway-analysis:${id}:put`);
	}

	function isPermittedDelete(id) {
		return AuthAPI.isPermitted(`pathway-analysis:${id}:delete`);
	}

	function isPermittedListGenerations(id) {
		return AuthAPI.isPermitted(`pathway-analysis:${id}:generation:get`);
	}

	function isPermittedGenerate(id, sourceKey) {
		return AuthAPI.isPermitted(`pathway-analysis:${id}:generation:*:post`) && AuthAPI.isPermitted(`source:${sourceKey}:access`);
	}

	function isPermittedResults(sourceKey) {
		return AuthAPI.isPermitted(`pathway-analysis:generation:*:result:get`) && AuthAPI.isPermitted(`source:${sourceKey}:access`);
	}

	function isPermittedExportByGeneration(id) {
		return AuthAPI.isPermitted(`pathway-analysis:generation:${id}:design:get`);
	}

	function isPermittedExport(id) {
		return AuthAPI.isPermitted(`pathway-analysis:${id}:export:get`);
	}


	return {
		isPermittedCreate,
		isPermittedImport,
		isPermittedList,
		isPermittedLoad,
		isPermittedUpdate,
		isPermittedDelete,
		isPermittedListGenerations,
		isPermittedGenerate,
		isPermittedResults,
		isPermittedExportByGeneration,
		isPermittedExport
	};
});
