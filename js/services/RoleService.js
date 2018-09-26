define(function(require, exports) {

  var constants = require('const');
  const CRUDService = require('providers/CRUDService');

  class RolesService extends CRUDService {
    async getRoleUsers(id) {
      const { data } = await this.httpService.doGet(constants.apiPaths.roleUsers(id));
      return data;
    }

    async getPermissions() {
      const { data } = await this.httpService.doGet(constants.apiPaths.permissions());
      return data;
    }

    async getRolePermissions(id) {
      const { data } = await this.httpService.doGet(constants.apiPaths.rolePermissions(id));
      return data;
    }

    async addRelations(roleId, relation, ids) {
      return await this.httpService.doPut(constants.apiPaths.relations(roleId, relation, ids));
    }

    async removeRelations(roleId, relation, ids) {
      return await this.httpService.doDelete(constants.apiPaths.relations(roleId, relation, ids));
    }
  }

  return new RolesService(constants.apiPaths.role());
});