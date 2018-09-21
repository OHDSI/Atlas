define(function(require, exports) {

  var constants = require('const');
  const CRUDService = require('providers/CRUDService');

  class RolesService extends CRUDService {
    getRoleUsers(id) {
      return this.httpService.doGet(constants.apiPaths.roleUsers(id))
        .then(({ data = [] }) => data);
    }

    getPermissions() {
      return this.httpService.doGet(constants.apiPaths.permissions())
        .then(({ data = [] }) => data);
    }

    getRolePermissions(id) {
      return this.httpService.doGet(constants.apiPaths.rolePermissions(id))
        .then(({ data = []}) => data);
    }

    addRelations(roleId, relation, ids) {
      return this.httpService.doPut(constants.apiPaths.relations(roleId, relation, ids));
    }

    removeRelations(roleId, relation, ids) {
      return this.httpService.doDelete(constants.apiPaths.relations(roleId, relation, ids));
    }
  }

  return new RolesService(constants.apiPaths.role());
});