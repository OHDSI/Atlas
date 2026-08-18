define([
	'services/AuthAPI'
], function (
	AuthAPI
) {

	// TODO: we don't need perms to list incidence rates
	function isPermittedReadIRs() {
		return true;
	};

	function isPermittedReadIR(id) {
		var grant = AuthAPI.getIRGrant(id);
		return  grant.isOwner ||
				AuthAPI.isPermitted("read:incidence") ||
				AuthAPI.isPermitted("write:incidence") ||
				AuthAPI.checkAccess("READ", grant.accessTypes);
	};

	function isPermittedExport(id) {
		return isPermittedReadIR(id);
	};

	function isPermittedCreateIR() {
		return AuthAPI.isPermitted('create:incidence');
	};

	function isPermittedImport() {
		return isPermittedCreateIR();
	};

	function isPermittedEditIR(id) {
		var grant = AuthAPI.getIRGrant(id);
		return  grant.isOwner ||
				AuthAPI.isPermitted("write:incidence") ||
				AuthAPI.checkAccess("WRITE", grant.accessTypes);
	}

	function isPermittedCopyIR(id) {
			return isPermittedReadIR(id) && isPermittedCreateIR();
	};
	
	function isPermittedDeleteIR(id) {
		return isPermittedEditIR(id);
	};

	function isPermittedExportSQL() {
		return true; // TODO: no permissions required
	}

	return {
		isPermittedReadIRs,
		isPermittedReadIR,
		isPermittedExport,
		isPermittedCreateIR,
		isPermittedImport,
		isPermittedCopyIR,
		isPermittedDeleteIR,
		isPermittedEditIR,
		isPermittedExportSQL,
	};

});