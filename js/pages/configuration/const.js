define(
  (require, exports) => {
    const config = require('appConfig');

    const pageTitle = 'Concept Sets';
    const paths = {
      role: (id = '') => `${config.api.url}role/${id}`,
      roleUsers: roleId => `${config.api.url}role/${roleId}/users`,
      permissions: () => `${config.api.url}permission`,
      rolePermissions: roleId => `${config.api.url}role/${roleId}/permissions`,
      relations: (roleId, relation, ids = []) => `${config.api.url}role/${roleId}/${relation}/${ids.join('+')}`,
    };

    const arraysDiff = function (base, another) {
      return base.filter(function (i) {
        return another.indexOf(i) < 0;
      });
     }

    return {
      pageTitle,
      paths,
      arraysDiff,
    };
  }
);