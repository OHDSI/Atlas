define([
	'services/AuthAPI',
], function (
	AuthAPI,
) {

	function isPermittedCreate() {
		return AuthAPI.isPermitted('admin:security');
	}

	function isPermittedList() {
		return AuthAPI.isPermitted('admin:security');
	}

	function isPermittedView(id) {
		return AuthAPI.isPermitted('admin:security');
	}

	function isPermittedEdit(id) {
		return isPermittedView(id) && AuthAPI.isPermitted('admin:security');
	}

	function isPermittedDelete(id) {
		return AuthAPI.isPermitted('admin:security');
	}

	return {
		isPermittedCreate,
		isPermittedList,
		isPermittedEdit,
		isPermittedDelete,
	};
});