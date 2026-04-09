define([
    'services/AuthAPI',
], function (
	AuthAPI,
) {
	function canCreate() {
		return AuthAPI.isPermitted('create:pathway');
	}

	function canRead(id) {
		var grant = AuthAPI.getPathwayGrant(id);
		return grant.isOwner ||
			AuthAPI.isPermitted('read:pathway') ||
			AuthAPI.isPermitted('write:pathway') ||
			AuthAPI.checkAccess('READ', grant.accessTypes);
	}

	function canWrite(id) {
		var grant = AuthAPI.getPathwayGrant(id);
		return grant.isOwner ||
			AuthAPI.isPermitted('write:pathway') ||
			AuthAPI.checkAccess('WRITE', grant.accessTypes);
	}

	function isPermittedCreate() {
		return canCreate();
	}

	function isPermittedImport() {
		return isPermittedCreate();
	}

	function isPermittedList() {
		return true; // anyone can list
	}

	function isPermittedLoad(id) {
		return canRead(id);
	}

	function isPermittedUpdate(id) {
		return canWrite(id);
	}

	function isPermittedDelete(id) {
		return isPermittedUpdate(id);
	}

	function isPermittedListGenerations(id) {
		return isPermittedLoad(id);
	}

	function isPermittedGenerate(id, sourceKey) {
		// allow generate only if user has write access to the source
		return AuthAPI.hasSourceAccess(sourceKey, 'WRITE');
	}

	function isPermittedResults(sourceKey) {
		return AuthAPI.hasSourceAccess(sourceKey, 'READ');
	}

	function isPermittedExportGenerationDesign(id) {
		return isPermittedLoad(id);
	}

	function isPermittedExport(id) {
		return isPermittedLoad(id);
	}

	function isPermittedCopy(id) {
		return isPermittedCreate() && isPermittedLoad(id);
	}


	return {
		isPermittedCreate,
		isPermittedCopy,
		isPermittedImport,
		isPermittedList,
		isPermittedLoad,
		isPermittedUpdate,
		isPermittedDelete,
		isPermittedListGenerations,
		isPermittedGenerate,
		isPermittedResults,
		isPermittedExportGenerationDesign,
		isPermittedExport
	};
});
