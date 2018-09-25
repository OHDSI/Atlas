define(function (require, exports) {

	const CRUDService = require('providers/CRUDService');
	const { apiPaths } = require('const');

	class PLPService extends CRUDService {}

	return new PLPService(apiPaths.plp());
});
