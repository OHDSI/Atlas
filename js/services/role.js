define(function(require, exports) {

  var constants = require('const');
  const httpService = require('services/http');
  const sharedState = require('atlas-state');
  const config = require('appConfig');
  const authApi = require('services/AuthAPI');

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

    static async updateRoles() {
      if (authApi.isPermittedReadRoles()){
        if (!config.userAuthenticationEnabled)
            return true;

        console.info('Updating roles');
        if (!authApi.isAuthenticated()) {
          console.warn('Roles are not updated');
          return Promise.resolve();
        }

        try {
          const roles = await this.getList();
          console.info('Roles updated');
          sharedState.roles(roles);
          return roles;
        } catch (err) {
          console.error(err);
        }
      }
    }
  }
});