define([
	'services/AuthAPI',
], function (
	AuthAPI,
) {

	function isPermittedCreate() {
		return AuthAPI.isPermitted('user:import:job:post');
	}

	function isPermittedList() {
		return AuthAPI.isPermitted('user:import:job:get');
	}

	function isPermittedView(id) {
		return AuthAPI.isPermitted(`user:import:job:${id}:get`);
	}

	function isPermittedEdit(id) {
		return isPermittedView(id) && AuthAPI.isPermitted(`user:import:job:${id}:put`);
	}

	function isPermittedDelete(id) {
		return AuthAPI.isPermitted(`user:import:job:${id}:delete`);
	}

	return {
		isPermittedCreate,
		isPermittedList,
		isPermittedEdit,
		isPermittedDelete,
	};
});