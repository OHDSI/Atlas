define([
	'services/AuthAPI',
], function (
	AuthAPI,
) {

	function isPermittedList() {
		return true;
	}

	function isPermittedCreate() {
		return AuthAPI.isPermitted(`create:reusable`);
	}

	function isPermittedUpdate(id) {
		var grant = AuthAPI.getReusableGrant(id);
		return grant.isOwner ||
			AuthAPI.isPermitted("write:reusable") ||
			AuthAPI.checkAccess("WRITE", grant.accessTypes);
	}

	function isPermittedLoad(id) {
		var grant = AuthAPI.getReusableGrant(id);
		return grant.isOwner ||
			AuthAPI.isPermitted("read:reusable") ||
			AuthAPI.isPermitted("write:reusable") ||
			AuthAPI.checkAccess("READ", grant.accessTypes);
	}

	function isPermittedDelete(id) {
		return isPermittedUpdate(id);
	}

	function isPermittedCopy(id) {
		return isPermittedLoad(id) && isPermittedCreate();
	}

	return {
		isPermittedCreate,
		isPermittedCopy,
		isPermittedList,
		isPermittedLoad,
		isPermittedUpdate,
		isPermittedDelete,
	};
});
