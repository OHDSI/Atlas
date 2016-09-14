define(function(require, exports) {

    var $ = require('jquery');
    var config = require('appConfig');

    var getServiceUrl = function() {
        return config.webAPIRoot;
    };

    var getToken = function() {
        if (localStorage.bearerToken && localStorage.bearerToken != 'null') {
            return localStorage.bearerToken;
        }

        return null;
    };

    var setToken = function(token) {
        localStorage.bearerToken = token;
    };

    var isAuthenticated = function() {
        var token = getToken();
        if (!token) {
            return false;
        }

        var expiration = getTokenExpirationDate();
        var now = new Date();

        return now < expiration;
    };

    var getAuthorizationHeader = function() {
        var token = getToken();
        if (!token) {
            return null;
        }
        return "Bearer " + token;
    };

    var extractPermissions = function() {
        var token = getToken();
        if (!token) {
            return null;
        }

        var payload = parseJwtPayload(token);
        var permissionsString = payload.permissions;
        if (!permissionsString) {
            return null;
        }

        var permissions = permissionsString.split('|');
        return permissions;
    };

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
        var etalons = extractPermissions();
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

    var getSubject = function() {
        var token = getToken();
        return token
            ? parseJwtPayload(token).sub
            : null;
    };

    var getTokenExpirationDate = function() {
        var token = getToken();
        if (!token) {
            return null;
        }

        var expirationInSeconds = parseJwtPayload(token).exp;
        var expirationDate = new Date(expirationInSeconds * 1000);
        return expirationDate;
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

    var logError = function(error) {
        if (!error) {
            return;
        }

        var msg = "";
        if (error.responseText) {
            msg += error.responseText;
        }

        console.log(msg);
    };

    var refreshToken = function() {
        var promise = $.ajax({
            url: getServiceUrl() + "user/refresh",
            method: 'GET',
            headers: {
                Authorization: getAuthorizationHeader()
            },
            success: function (data, textStatus, jqXHR) {
                var token = jqXHR.getResponseHeader('Bearer');
                setToken(token);
            },
            error: function (error) {
                setToken(null);
            },
        });

        return promise;
    }

    var isPermittedCreateConceptset = function() {
        return isPermitted('conceptset:edit:ui');
    }

    var isPermittedUpdateConceptset = function(conceptsetId) {
        return isPermitted('conceptset:edit:ui');
    };

    var isPermittedReadCohorts = function() {
        return isPermitted('cohort:read:ui');
    }

    var isPermittedCreateCohort = function() {
        return isPermitted('cohort:edit:ui');
    }

    var isPermittedUpdateCohort = function(id) {
        var permission = 'cohortdefinition:' + id + ':put';
        return isPermitted(permission);
    }

    var isPermittedDeleteCohort = function(id) {
        var permission = 'cohortdefinition:' + id + ':delete';
        return isPermitted(permission);
    }

    var isPermittedReadJobs = function() {
        return isPermitted('job:execution:get');
    }

    var isPermittedEditConfiguration = function() {
        return isPermitted('configuration:edit:ui')
    }

    var api = {
        getToken: getToken,
        setToken: setToken,
        getSubject: getSubject,
        getTokenExpirationDate: getTokenExpirationDate,
        getAuthorizationHeader: getAuthorizationHeader,
        refreshToken: refreshToken,

        isAuthenticated: isAuthenticated,

        isPermittedCreateConceptset: isPermittedCreateConceptset,
        isPermittedUpdateConceptset: isPermittedUpdateConceptset,

        isPermittedReadCohorts: isPermittedReadCohorts,
        isPermittedCreateCohort: isPermittedCreateCohort,
        isPermittedUpdateCohort: isPermittedUpdateCohort,
        isPermittedDeleteCohort: isPermittedDeleteCohort,

        isPermittedReadJobs: isPermittedReadJobs,

        isPermittedEditConfiguration: isPermittedEditConfiguration,
    };

    return api;
});
