define(function(require, exports) {

    var $ = require('jquery');
    var config = require('appConfig');
    var ko = require('knockout');

    var getServiceUrl = function () {
        return config.webAPIRoot;
    };

    var tokenExpirationDate = ko.pureComputed(function() {
        if (!token()) {
            return null;
        }

        var expirationInSeconds = parseJwtPayload(token()).exp;
        return new Date(expirationInSeconds * 1000);

    });
    var permissions = ko.pureComputed(function() {
        if (!token()) {
            return null;
        }

        var payload = parseJwtPayload(token());
        var permissionsString = payload.permissions;
        if (!permissionsString) {
            return null;
        }

        return permissionsString.split('|');
    });
    var subject = ko.pureComputed(function() {
        return token()
            ? parseJwtPayload(token()).sub
            : null;
    });
    var token = ko.observable();
    if (localStorage.bearerToken && localStorage.bearerToken != 'null') {
        token(localStorage.bearerToken);
    } else {
        token(null);
    }
    token.subscribe(function(newValue) {
        localStorage.bearerToken = newValue;
    });

    var isAuthenticated = ko.pureComputed(function() {
				if (!config.userAuthenticationEnabled) {
					return true;
				}
			
        if (!token()) {
            return false;
        }

        return new Date() < tokenExpirationDate();
    });

    var getAuthorizationHeader = function () {
        if (!token()) {
            return null;
        }
        return "Bearer " + token();
    };

    var handleAccessDenied = function(xhr) {
        switch (xhr.status) {
        case 401:
            token(null);
            break;
        case 403:
            refreshToken();
            break;
        }
    }
    
    var checkPermission = function(permission, etalon) {
        // etalon may be like '*:read,write:etc'
        if (!etalon || !permission) {
            return false;
        }

        if (permission == etalon) {
            return true;
        }

        var etalonLevels = etalon.split(':');
        var permissionLevels = permission.split(':');

        if (etalonLevels.length != permissionLevels.length) {
            return false;
        }

        for (var i = 0; i < permissionLevels.length; i++) {
            var pLevel = permissionLevels[i];
            var eLevels = etalonLevels[i].split(',');

            if (eLevels.indexOf('*') < 0 && eLevels.indexOf(pLevel) < 0) {
                return false;
            }
        }

        return true;
    };

    var isPermitted = function (permission) {
        var etalons = permissions();
        if (!etalons) {
            return false;
        }

        for (var i = 0; i < etalons.length; i++) {
            if (checkPermission(permission, etalons[i])) {
                return true;
            }
        }

        return false;
    };

    var base64urldecode = function (arg) {
        var s = arg;
        s = s.replace(/-/g, '+'); // 62nd char of encoding
        s = s.replace(/_/g, '/'); // 63rd char of encoding
        switch (s.length % 4) // Pad with trailing '='s
        {
            case 0: break; // No pad chars in this case
            case 2: s += "=="; break; // Two pad chars
            case 3: s += "="; break; // One pad char
            default: throw new Error("Illegal base64url string!");
        }
        return window.atob(s); // Standard base64 decoder
    };

    var parseJwtPayload = function (jwt) {
        var parts = jwt.split(".");
        if (parts.length != 3) {
            throw new Error("JSON Web Token must have three parts");
        }

        var payload = base64urldecode(parts[1]);
        return $.parseJSON(payload);
    };

    var refreshToken = function() {
        var promise = $.ajax({
            url: getServiceUrl() + "user/refresh",
            method: 'GET',
            headers: {
                Authorization: getAuthorizationHeader()
            },
            success: function (data, textStatus, jqXHR) {
                token(jqXHR.getResponseHeader('Bearer'));
            },
            error: function (error) {
                token(null);
            },
        });

        return promise;
    }

    var isPermittedCreateConceptset = function() {
        return isPermitted('conceptset:put');
    }

    var isPermittedUpdateConceptset = function(conceptsetId) {
        return isPermitted('conceptset:' + conceptsetId + ':post') && isPermitted('conceptset:' + conceptsetId + ':items:post');
    };
    
    var isPermittedDeleteConceptset = function(id) {
        return isPermitted('conceptset:' + id + ':delete:post');
    }

    var isPermittedReadCohort = function(id) {
        return isPermitted('cohortdefinition:' + id + ':get') && isPermitted('cohortdefinition:sql:post');
    }

    var isPermittedReadCohorts = function() {
        return isPermitted('cohortdefinition:get');
    }

    var isPermittedCreateCohort = function() {
        return isPermitted('cohortdefinition:put');
    }

    var isPermittedCopyCohort = function(id) {
        return isPermitted('cohortdefinition:' + id + ':copy:get');
    }

    var isPermittedUpdateCohort = function(id) {
        var permission = 'cohortdefinition:' + id + ':put';
        return isPermitted(permission);
    }

    var isPermittedDeleteCohort = function(id) {
        var permission = 'cohortdefinition:' + id + ':delete';
        return isPermitted(permission);
    }

    var isPermittedGenerateCohort = function(cohortId, sourceKey) {
        return isPermitted('cohortdefinition:' + cohortId + ':generate:' + sourceKey + ':get') &&
            isPermitted('cohortdefinition:' + cohortId + ':info:get');
    }

    var isPermittedReadCohortReport = function(cohortId, sourceKey) {
        return isPermitted('cohortdefinition:' + cohortId + ':report:' + sourceKey + ':get');
    }

    var isPermittedReadJobs = function() {
        return isPermitted('job:execution:get');
    }

    var isPermittedEditConfiguration = function() {
        return isPermitted('configuration:edit:ui')
    }

    var isPermittedReadRoles = function() {
        return isPermitted('role:get');
    }
    var isPermittedReadRole = function (roleId) {
        var permitted =
                isPermitted('role:' + roleId + ':get') &&
                isPermitted('permission:get') &&
                isPermitted('role:' + roleId + ':permissions:get') &&
                isPermitted('user:get') &&
                isPermitted('role:' + roleId + ':users:get');
        return permitted;
    }
    var isPermittedEditRole = function(roleId) {
        return isPermitted('role:' + roleId + ':post');
    }
    var isPermittedCreateRole = function() {
        return isPermitted('role:put');
    }
    var isPermittedDeleteRole = function(roleId) {
        return isPermitted('role:' + roleId + ':delete');
    }
    var isPermittedEditRoleUsers = function(roleId) {
        return isPermitted('role:' + roleId + ':users:*:put') && isPermitted('role:' + roleId + ':users:*:delete');
    }
    var isPermittedEditRolePermissions = function(roleId) {
        return isPermitted('role:' + roleId + ':permissions:*:put') && isPermitted('role:' + roleId + ':permissions:*:delete');
    }

    var api = {
        token: token,
        subject: subject,
        tokenExpirationDate: tokenExpirationDate,
        getAuthorizationHeader: getAuthorizationHeader,
        handleAccessDenied: handleAccessDenied,
        refreshToken: refreshToken,

        isAuthenticated: isAuthenticated,

        isPermittedCreateConceptset: isPermittedCreateConceptset,
        isPermittedUpdateConceptset: isPermittedUpdateConceptset,
        isPermittedDeleteConceptset: isPermittedDeleteConceptset,

        isPermittedReadCohorts: isPermittedReadCohorts,
        isPermittedReadCohort: isPermittedReadCohort,
        isPermittedCreateCohort: isPermittedCreateCohort,
        isPermittedCopyCohort: isPermittedCopyCohort,
        isPermittedUpdateCohort: isPermittedUpdateCohort,
        isPermittedDeleteCohort: isPermittedDeleteCohort,
        isPermittedGenerateCohort: isPermittedGenerateCohort,
        isPermittedReadCohortReport: isPermittedReadCohortReport,

        isPermittedReadJobs: isPermittedReadJobs,

        isPermittedEditConfiguration: isPermittedEditConfiguration,

        isPermittedReadRoles: isPermittedReadRoles,
        isPermittedReadRole: isPermittedReadRole,
        isPermittedEditRole: isPermittedEditRole,
        isPermittedCreateRole: isPermittedCreateRole,
        isPermittedDeleteRole: isPermittedDeleteRole,
        isPermittedEditRoleUsers: isPermittedEditRoleUsers,
        isPermittedEditRolePermissions: isPermittedEditRolePermissions,
    };

    return api;
});
