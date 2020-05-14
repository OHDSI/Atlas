define([
	'services/AuthAPI'
], function (
	AuthAPI
) {

	function isPermittedExportSQL() {
		return AuthAPI.isPermitted('ir:sql:post');
	}

	return {
		isPermittedExportSQL,
	};

});