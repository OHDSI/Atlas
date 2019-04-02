define(function(require, exports) {

  var constants = require('const');
  const httpService = require('services/http');

  return class RolesService {
    static getList() {
      return httpService.doGet(constants.apiPaths.role())
        .then(({ data = [] }) => data);
    }

    static load(id) {
      return httpService.doGet(constants.apiPaths.role(id))
        .then(({ data }) => data);
    }

    static getRoleUsers(id) {
      return httpService.doGet(constants.apiPaths.roleUsers(id))
        .then(({ data = [] }) => data);
    }

    static getPermissions() {
      return httpService.doGet(constants.apiPaths.permissions())
        .then(({ data = [] }) => data);
    }

    static getRolePermissions(id) {
      return httpService.doGet(constants.apiPaths.rolePermissions(id))
        .then(({ data = []}) => data);
    }

    static addRelations(roleId, relation, ids) {
      return httpService.doPut(constants.apiPaths.relations(roleId, relation, ids));
    }

    static removeRelations(roleId, relation, ids) {
      return httpService.doDelete(constants.apiPaths.relations(roleId, relation, ids));
    }

    static create(role) {
      return httpService.doPost(constants.apiPaths.role(), role)
        .then(({ data }) => data);
    }

    static update(role) {
      return httpService.doPut(constants.apiPaths.role() + role.id, role)
        .then(({ data }) => data);
    }

    static delete(id) {
      return httpService.doDelete(constants.apiPaths.role(id));
    }
  }
});