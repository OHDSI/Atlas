define(function(require, exports) {

    var $ = require('jquery');
    var config = require('appConfig');
    var ko = require('knockout');
    var cookie = require('services/CookieAPI');
    var TOKEN_HEADER = 'Bearer';
    var LOCAL_STORAGE_PERMISSIONS_KEY = "permissions";
    const httpService = require('services/http');

    const signInOpened = ko.observable(false);

    var authProviders = config.authProviders.reduce(function(result, current) {
        result[config.api.url + current.url] = current;
        return result;
    }, {});

    var getServiceUrl = function () {
        return config.webAPIRoot;
    };

    var token = ko.observable();
    if (localStorage.bearerToken && localStorage.bearerToken != 'null') {
        token(localStorage.bearerToken);
    } else {
        token(null);
    }

    var getAuthorizationHeader = function () {
        if (!token()) {
            return null;
        }
        return TOKEN_HEADER + ' ' + token();
    };

    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!authProviders[settings.url] && settings.url.startsWith(config.api.url)) {
                xhr.setRequestHeader('Authorization', getAuthorizationHeader());
            }
        }
    });

    var subject = ko.observable();
    var permissions = ko.observable();

    const loadUserInfo = function() {
        return new Promise((resolve, reject) => $.ajax({
            url: config.api.url + 'user/me',
            method: 'GET',
            success: function (info) {
                subject(info.login);
                permissions(info.permissions.map(p => p.permission));
                resolve();
            },
            error: function (err) {
                if (err.status === 401) {
                    console.log('User is not authed');
                    subject(null);
                    resolve();
                } else {
                    reject('Cannot retrieve user info');
                }
            }
        }));
    };

    var tokenExpirationDate = ko.pureComputed(function() {
        if (!token()) {
            return null;
        }

        try {
            var expirationInSeconds = parseJwtPayload(token()).exp;
            return new Date(expirationInSeconds * 1000);
        } catch (e) {
            return new Date();
        }

    });

    const tokenExpired = ko.observable(false);
    const askLoginOnTokenExpire = (function() {
        let expirationTimeout;
        return () => {
            if (expirationTimeout) {
                clearTimeout(expirationTimeout);
            }
            if (!token()) {
                tokenExpired(false);
                return;
            }
            if (tokenExpirationDate() > new Date()) {
                tokenExpired(false);
                expirationTimeout = setTimeout(
                    () => {
                        tokenExpired(true);
						signInOpened(true);
                        expirationTimeout = null;
                    },
                    tokenExpirationDate() - new Date()
                );
            } else {
                tokenExpired(true);
            }
        }
    })();

    askLoginOnTokenExpire();
    tokenExpirationDate.subscribe(askLoginOnTokenExpire);

    window.addEventListener('storage', function(event) {
        if (event.storageArea === localStorage && localStorage.bearerToken !== token()) {
            token(localStorage.bearerToken);
        };
    }, false);

    token.subscribe(function(newValue) {
        localStorage.bearerToken = newValue;
        cookie.setField("bearerToken", newValue);
    });

    var isAuthenticated = ko.computed(() => {
        if (!config.userAuthenticationEnabled) {
            return true;
        }

        return !!subject();
    });

    var handleAccessDenied = function(xhr) {
        switch (xhr.status) {
        case 401:
            resetAuthParams();
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
        if (!config.userAuthenticationEnabled) {
            return true;
        }

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

    function base64urldecode(arg) {
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

    function parseJwtPayload(jwt) {
        var parts = jwt.split(".");
        if (parts.length != 3) {
            throw new Error("JSON Web Token must have three parts");
        }

        var payload = base64urldecode(parts[1]);
        return $.parseJSON(payload);
    };

    var refreshTokenPromise = null;
    var isPromisePending = function(p) {
        return p && typeof p === 'object' && typeof p.status === 'function' && p.status() === 'pending';
    }
    var refreshToken = function() {

        if (!isPromisePending(refreshTokenPromise)) {
          refreshTokenPromise = httpService.doGet(getServiceUrl() + "user/refresh");
          refreshTokenPromise.then(({ data, headers }) => {
            setAuthParams(headers.get(TOKEN_HEADER));
          });
          refreshTokenPromise.catch(() => {
            resetAuthParams();
          });
        }

        return refreshTokenPromise;
    }

    var isPermittedCreateConceptset = function() {
        return isPermitted('conceptset:post');
    }

    var isPermittedReadConceptsets = function () {
        return isPermitted('conceptset:get');
    };

    var isPermittedUpdateConceptset = function(conceptsetId) {
        return (isPermitted('conceptset:' + conceptsetId + ':put') && isPermitted('conceptset:' + conceptsetId + ':items:put')) || (isPermitted('conceptset:*:put') && isPermitted('conceptset:*:items:put'));
    };

    var isPermittedDeleteConceptset = function(id) {
        return isPermitted('conceptset:' + id + ':delete');
    };

    var isPermittedReadIRs = function () {
      return isPermitted('ir:get');
    };

    var isPermittedEditIR = function (id) {
      return isPermitted('ir:' + id + ':put');
    };

    var isPermittedCreateIR = function () {
      return isPermitted('ir:post');
    };

    var isPermittedDeleteIR = function(id) {
        return isPermitted('ir:' + id + ':delete');
    };

    var isPermittedCopyIR = function(id) {
        return isPermitted('ir:' + id + ':copy:get');
    };

    var isPermittedReadEstimations = function () {
      return isPermitted('comparativecohortanalysis:get');
    };

    var isPermittedEditSourcePriortiy = function() {
      return isPermitted('source:*:daimons:*:set-priority:post')
    };

    var isPermittedReadEstimation = function (id) {
      return isPermitted('comparativecohortanalysis:' + id + ':get');
    };

    var isPermittedCreateEstimation = function() {
        return isPermitted('comparativecohortanalysis:post');
    };

    const isPermittedDeleteEstimation = function(id) {
        return isPermitted(`comparativecohortanalysis:${id}:delete`);
    }

    var isPermittedReadPlps = function() {
        return isPermitted('plp:get');
    };

    var isPermittedCreatePlp = function () {
      return isPermitted('plp:post');
    };

    var isPermittedReadPlp = function(id) {
        return isPermitted('plp:' + id + ':get');
    };

    var isPermittedDeletePlp = function(id) {
        return isPermitted('plp:' + id + ':delete');
    };

    var isPermittedCopyPlp = function(id) {
        return isPermitted(`plp:${id}:copy:get`);
    }

    var isPermittedSearch = function() {
      return isPermitted('vocabulary:*:search:*:get');
    };

    var isPermittedViewCdmResults = function () {
        return isPermitted('cdmresults:*:get');
    };

    var isPermittedViewProfiles = function (sourceKey) {
      return isPermitted(`${sourceKey}:person:*:get`);
    };

    var isPermittedViewProfileDates = function() {
      return isPermitted('*:person:*:get:dates');
    };

    var isPermittedReadCohort = function(id) {
        return isPermitted('cohortdefinition:' + id + ':get') && isPermitted('cohortdefinition:sql:post');
    }

    var isPermittedReadCohorts = function() {
        return isPermitted('cohortdefinition:get');
    }

    var isPermittedCreateCohort = function() {
        return isPermitted('cohortdefinition:post');
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
        var allPermissions = 'cohortdefinition:delete';
        return isPermitted(permission) || isPermitted(allPermissions);
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

    var isPermittedCreateSource = function() {
        return isPermitted('source:post');
    }

    var isPermittedReadSource = function(key) {
        return isPermitted('source:' + key + ':get');
    }

    var isPermittedCheckSourceConnection = function(key) {
      return isPermitted('source:connection:' + key + ':get');
    }

    var isPermittedEditSource = function(key) {
        return isPermitted('source:' + key + ':put');
    }

    var isPermittedDeleteSource = function(key) {
        return isPermitted('source:' + key + ':delete');
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
        return isPermitted('role:' + roleId + ':put');
    }
    var isPermittedCreateRole = function() {
        return isPermitted('role:post');
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
    const isPermittedGetAllNotifications = function() {
        return isPermitted('notifications:get');
    };
    const isPermittedGetViewedNotifications = function() {
        return isPermitted('notifications:viewed:get');
    };
    const isPermittedPostViewedNotifications = function() {
        return isPermitted('notifications:viewed:post');
    };

		const isPermittedImportUsers = function() {
			return isPermitted('user:import:post') && isPermitted('user:import:*:post');
		}

    const hasSourceAccess = function (sourceKey) {
        return isPermitted(`source:${sourceKey}:access`) || /* For 2.5.* and below */ isPermitted(`cohortdefinition:*:generate:${sourceKey}:get`);
	}

	var setAuthParams = function (tokenHeader) {
        token(tokenHeader);
        return loadUserInfo();
    };

    var resetAuthParams = function () {
        token(null);
        subject(null);
        permissions(null);
    };

    var api = {
        token: token,
        subject: subject,
        tokenExpirationDate: tokenExpirationDate,
        tokenExpired: tokenExpired,
        setAuthParams: setAuthParams,
        resetAuthParams: resetAuthParams,
        getAuthorizationHeader: getAuthorizationHeader,
        handleAccessDenied: handleAccessDenied,
        refreshToken: refreshToken,

        isAuthenticated: isAuthenticated,
		signInOpened: signInOpened,
        isPermitted: isPermitted,

        isPermittedGetAllNotifications: isPermittedGetAllNotifications,
        isPermittedGetViewedNotifications: isPermittedGetViewedNotifications,
        isPermittedPostViewedNotifications: isPermittedPostViewedNotifications,

        isPermittedCreateConceptset: isPermittedCreateConceptset,
        isPermittedUpdateConceptset: isPermittedUpdateConceptset,
        isPermittedDeleteConceptset: isPermittedDeleteConceptset,
        isPermittedReadConceptsets: isPermittedReadConceptsets,

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
        isPermittedEditSourcePriority: isPermittedEditSourcePriortiy,

        isPermittedReadRoles: isPermittedReadRoles,
        isPermittedReadRole: isPermittedReadRole,
        isPermittedEditRole: isPermittedEditRole,
        isPermittedCreateRole: isPermittedCreateRole,
        isPermittedDeleteRole: isPermittedDeleteRole,
        isPermittedEditRoleUsers: isPermittedEditRoleUsers,
        isPermittedEditRolePermissions: isPermittedEditRolePermissions,

        isPermittedReadIRs: isPermittedReadIRs,
        isPermittedCreateIR: isPermittedCreateIR,
        isPermittedEditIR: isPermittedEditIR,
        isPermittedDeleteIR: isPermittedDeleteIR,
        isPermittedCopyIR,

        isPermittedReadEstimations: isPermittedReadEstimations,
        isPermittedReadEstimation: isPermittedReadEstimation,
        isPermittedCreateEstimation: isPermittedCreateEstimation,
        isPermittedDeleteEstimation,

        isPermittedReadPlps: isPermittedReadPlps,
        isPermittedReadPlp: isPermittedReadPlp,
        isPermittedCreatePlp: isPermittedCreatePlp,
        isPermittedDeletePlp: isPermittedDeletePlp,
        isPermittedCopyPlp: isPermittedCopyPlp,

        isPermittedSearch: isPermittedSearch,
        isPermittedViewCdmResults: isPermittedViewCdmResults,
        isPermittedViewProfiles: isPermittedViewProfiles,
        isPermittedViewProfileDates: isPermittedViewProfileDates,

        isPermittedReadSource: isPermittedReadSource,
        isPermittedCreateSource: isPermittedCreateSource,
        isPermittedEditSource: isPermittedEditSource,
        isPermittedDeleteSource: isPermittedDeleteSource,
        isPermittedCheckSourceConnection: isPermittedCheckSourceConnection,

        isPermittedImportUsers,
        hasSourceAccess,

        loadUserInfo,
        TOKEN_HEADER,
    };

    return api;
});
