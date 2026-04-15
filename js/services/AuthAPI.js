define(function(require, exports) {

    var $ = require('jquery');
    var config = require('appConfig');
    var ko = require('knockout');
    var cookie = require('services/CookieAPI');
    var TOKEN_HEADER = 'Bearer';
    var LOCAL_STORAGE_PERMISSIONS_KEY = "permissions";
    const httpService = require('services/http');
    const NONE_ENTITY_GRANT = {accessTypes: [], isOwner: false};
    const sharedState = require('atlas-state');

    const AUTH_PROVIDERS = {
        IAP: 'AtlasGoogleSecurity',
    };

    const AUTH_CLIENTS = {
        SAML: 'AUTH_CLIENT_SAML',
    };

    const signInOpened = ko.observable(false);

    function getBearerToken() {
        return localStorage.bearerToken && localStorage.bearerToken !== 'null' && localStorage.bearerToken !== 'undefined' ? localStorage.bearerToken : null;
	}

    var authProviders = config.authProviders.reduce(function(result, current) {
        result[config.api.url + current.url] = current;
        return result;
    }, {});

    var getServiceUrl = function () {
        return config.webAPIRoot;
    };

    var token = ko.observable(getBearerToken());
    var authClient = ko.computed({
        owner: ko.observable(localStorage.getItem("auth-client")),
        read: function() { 
            return this(); 
        },
        write: function( newValue ) {
            localStorage.setItem("auth-client", newValue);
            this( newValue );
        }
    });

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
                xhr.setRequestHeader('Action-Location', location);
            }
        }
    });

    var reloginRequired = ko.observable(false);
    var subject = ko.observable();
    var permissions = ko.observable();
    var fullName = ko.observable();
    const authProvider = ko.observable();

    authProvider.subscribe(provider => {
        if (provider === AUTH_PROVIDERS.IAP) {
            const id = 'google-iap-refresher';
            const iframe = `<iframe id="${id}" src="/_gcp_iap/session_refresher" style="position: absolute; width:0;height:0;border:0; border:none;"></iframe>`;
            $('#' + id).remove();
            $('body').append(iframe);
        }
    });

    const loadUserInfo = function() {
        return new Promise((resolve, reject) => $.ajax({
            url: config.api.url + 'user/me',
            method: 'GET',
            success: function (info, textStatus, jqXHR) {
                permissions(info.authz);  // Store user authroizations in permissions observable
                subject(info.user.login);
                authProvider(jqXHR.getResponseHeader('x-auth-provider'));
                fullName(info.user.name ? info.user.name : info.user.login);
                resolve();
            },
            error: function (err) {
                if (err.status === 401) {
                    console.log('User is not authed');
                    subject(null);
                    if (config.enableSkipLogin) {
                        signInOpened(true);
                    }
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
        if (event.storageArea === localStorage) {
            let bearerToken = getBearerToken();
            if (bearerToken !== token()) {
                token(bearerToken);
            }
        }
    }, false);

    token.subscribe(function(newValue) {
        localStorage.bearerToken = newValue;
        cookie.setField("bearerToken", newValue);
    });

    var isAuthenticated = ko.computed(() => {
        return !!token();
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

    // adapted from https://github.com/apache/shiro/blob/fa518ec985fd192497cd04e2569041b2f469aead/core/src/main/java/org/apache/shiro/authz/permission/WildcardPermission.java#L201

    var checkPermission = function(permission, etalon) {
        // etalon may be like '*:read,write:etc', and is a permission assigned to the user.
        // permission is the permission to check
        if (!etalon || !permission) { // both must be non-null to perform a check
            return false;
        }

        if (permission == etalon) { // quick check: if equal on both sides, then permission is granted.
            return true;
        }

        var etalonLevels = etalon.split(':');
        var permissionLevels = permission.split(':');

        var i = 0;
        for (let permissionLevel of permissionLevels) {
            // If this etalon has less parts than the permission, everything after the number of parts contained
            // in this etalon is automatically implied, so return true
            if (etalonLevels.length - 1 < i) {
                return true;
            } else {
                var etalonPart = etalonLevels[i].split(',');
                var permissionPart = permissionLevel.split(',');
                if (!etalonPart.includes("*") && !permissionPart.every(pp => etalonPart.includes(pp))) {
                    return false;
                }
            }
            i++;
        }
        // If etalon has more parts than the permission, return true if rest of eLevels contains wildcard
        for (; i < etalonLevels.length; i++) { // loop through remaining etalonLevels
            var etalonPart = etalonLevels[i].split(',');
            if (!etalonPart.includes("*")) {
                return false;
            }
        }
        return true;
    };

    var isPermitted = function (permission) {
        // TODO: we have a more complex object now: UserAuthorizations containing permissions and AccessGrants
        // TODO: so maybe replace references to permissions() with authz()
        var etalons = permissions() && permissions().permissions || [];
        return etalons.some(e => checkPermission(permission, e));
    };

    // this function will handle 'write implies read' when checking an access type against a set of granted access
    var checkAccess = function (check, granted) {
        if (check == "READ") {
            return (["READ", "WRITE"]).some(c => granted.includes(c));
        }
        return granted.includes(check);  
    }

    var getCCGrant = function(id) {
        var ccId = +id; // force to numeric
        var authz = permissions().cohortCharacterizationAccess;
        return authz[ccId] || NONE_ENTITY_GRANT; // assign a falsy entity grant if not found
    }

    var getFAGrant = function(id) {
        var faId = +id; // force to numeric
        var authz = permissions().feAnalysisAccess;
        return authz[faId] || NONE_ENTITY_GRANT; // assign a falsy entity grant if not found
    }    

    var getIRGrant = function(id) {
        var irId = +id; // force to numeric
        var authz = permissions().incidenceRateAccess;
        return authz[irId] || NONE_ENTITY_GRANT; // assign a falsy entity grant if not found
    }

    var getPathwayGrant = function(id) {
        var pathwayId = +id; // force to numeric
        var authz = permissions().pathwayAccess;
        return authz[pathwayId] || NONE_ENTITY_GRANT; // assign a falsy entity grant if not found
    }

    var getSourceGrant = function(id) {
        var sourceId = +id; // force to numeric
        var authz = permissions().sourceAccess;
        return authz[sourceId] || []; // source grants only have access types in their grant.
    }

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
          refreshTokenPromise.then(({data}) => {
            setAuthParams(data.jwt);
          });
          refreshTokenPromise.catch(() => {
            resetAuthParams();
          });
        }

        return refreshTokenPromise;
    }

    var isPermittedReadConceptset = function(conceptsetId) {
        var id = +conceptsetId; // force to numeric
        var authz = permissions().conceptSetAccess;
        var grant = authz[id] || NONE_ENTITY_GRANT; // assign a falsy entity grant if not found
        return  grant.isOwner ||
            isPermitted("read:conceptset") ||
            isPermitted("write:conceptset") ||
            checkAccess("READ", grant.accessTypes);
    }

    var isPermittedCreateConceptset = function() {
        return isPermitted('create:conceptset');
    }

    var isPermittedUpdateConceptset = function(conceptsetId) {
        var id = +conceptsetId; // force to numeric
        var authz = permissions().conceptSetAccess;
        var grant = authz[id] || NONE_ENTITY_GRANT; // assign a falsy entity grant if not found
        return  grant.isOwner ||
            isPermitted("write:conceptset") ||
            checkAccess("WRITE", grant.accessTypes);    
    };

    var isPermittedDeleteConceptset = function(id) {
        return isPermittedUpdateConceptset(id);
    };

    var isPermittedViewCdmResults = function () {
        return true; // TODO: Do we need general view permission + source??
    };

    var isPermittedViewProfiles = function (sourceKey) {
      return hasSourceAccess(sourceKey);
    };

    var isPermittedViewProfileDates = function() {
      return hasSourceAccess(sourceKey);
    };

    var isPermittedReadCohorts = function() {
        return true; // TODO: remove list perm checks
    }
    
    var isPermittedReadCohort = function(id) {
        var cohortId = +id; // force to numeric
        var authz = permissions().cohortDefinitionAccess;
        var grant = authz[cohortId] || NONE_ENTITY_GRANT; // assign a falsy entity grant if not found
        return  grant.isOwner ||
            isPermitted("read:cohort-definition") ||
            isPermitted("write:cohort-definition") ||
            checkAccess("READ", grant.accessTypes);
    }

    var isPermittedCreateCohort = function() {
        return isPermitted('create:cohort-definition');
    }

    var isPermittedCopyCohort = function(id) {
        return isPermittedCreateCohort();
    }

    var isPermittedUpdateCohort = function(id) {
        var cohortId = +id; // force to numeric
        var authz = permissions().cohortDefinitionAccess;
        var grant = authz[cohortId] || NONE_ENTITY_GRANT; // assign a falsy entity grant if not found
        return  grant.isOwner ||
            isPermitted("write:cohort-definition") ||
            checkAccess("WRITE", grant.accessTypes);
    }

    var isPermittedDeleteCohort = function(id) {
       return isPermittedUpdateCohort(id);
    }

    var isPermittedGenerateCohort = function(cohortId, sourceKey) {
        return hasSourceAccess(sourceKey, "WRITE");
    }

    var isPermittedReadCohortReport = function(cohortId, sourceKey) {
        return hasSourceAccess(sourceKey);
    }

    var isPermittedReadJobs = function() {
        return true;
    }

    var isPermittedEditConfiguration = function() {
        return isPermitted('admin:source'); // everyone can view config, just need specific perms to make specific changes.
    }

    var isPermittedCreateSource = function() {
        return isPermitted('admin:source');
    }

    var isPermittedAccessSource = function(key) {
        return hasSourceAccess(key); 
    }

    var isPermittedReadSource = function(key) {
        return hasSourceAccess(key);
    }

    var isPermittedCheckSourceConnection = function(key) {
      return hasSourceAccess(key) || isPermitted('admin:source');
    }

    var isPermittedEditSource = function(key) {
        return isPermitted('admin:source');
    }

    var isPermittedDeleteSource = function(key) {
        return isPermitted('admin:source');
    }

    var isPermittedReadRoles = function() {
        return true; // anyone should be able to list roles
    }
    var isPermittedReadRole = function (roleId) {
        return isPermitted('admin:security');
    }
    var isPermittedEditRole = function(roleId) {
        return isPermitted('admin:security');
    }
    var isPermittedCreateRole = function() {
        return isPermitted('admin:security');
    }
    var isPermittedDeleteRole = function(roleId) {
        return isPermitted('admin:security');
    }
    var isPermittedEditRoleUsers = function(roleId) {
        return isPermitted('admin:security');
    }
    var isPermittedEditRolePermissions = function(roleId) {
        return isPermitted('admin:security');
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
    const isPermittedGetExecutionService = function() {
        return isPermitted('executionservice:*:get');
    };
    const isPermittedGetSourceDaimonPriority = function() {
        return true; // isPermitted('source:daimon:priority:get');  //TODO: shouldn't everyone be able to lookup source daimon priority? 
    };

    const isPermittedImportUsers = function() {
        return isPermitted('admin:security');
    }

    const hasSourceAccess = function (sourceKey, accessType = "READ") {
        var sourceId = (sharedState.sources().find(s => s.sourceKey == sourceKey) || {}).sourceId;
        
        if (!sourceId) return false; // source not found

        var authz = permissions().sourceAccess;
        var accessTypes = authz[sourceId] || []; // default to no access
        if (accessType == "READ") {
            return isPermitted("read:source") || isPermitted("write:source") || checkAccess("READ", accessTypes);
        } else if (accessType == "WRITE") {
            return isPermitted("write:source") || checkAccess("WRITE", accessTypes);
        }

        return false;
    }

    const isPermittedClearServerCache = function (sourceKey) {
        return isPermitted('admin:cache');
    };

    const isPermittedTagsManagement = function () {
        return isPermitted("admin:tags");
    };

    const isPermittedConceptSetAnnotationsDelete = function (conceptSetId) {
        return isPermittedUpdateConceptset(conceptSetId);
    };    

    const isPermittedRunAs = () => isPermitted('admin:run-as');

    const isPermittedViewDataSourceReport = sourceKey => hasSourceAccess(sourceKey);

    const isPermittedViewDataSourceReportDetails = sourceKey => hasSourceAccess(sourceKey);

	const setAuthParams = (jwt) => {
        !!jwt && token(jwt);
    };

    var resetAuthParams = function () {
        token(null);
        subject(null);
        permissions(null);
    };

    const runAs = function(login, success, error) {
        return $.ajax({
					method: 'POST',
					url: config.webAPIRoot + 'user/runas',
					data: {
						login,
					},
          success,
          error,
        });
    };

    const executeWithRefresh = async function(httpPromise) {
        const result = await httpPromise;
        await loadUserInfo();
        return result;
    }

    var api = {
        AUTH_PROVIDERS: AUTH_PROVIDERS,
        AUTH_CLIENTS: AUTH_CLIENTS,
        NONE_ENTITY_GRANT: NONE_ENTITY_GRANT,

        token: token,
        authClient: authClient,
        reloginRequired: reloginRequired,
        subject: subject,
        fullName,
        tokenExpirationDate: tokenExpirationDate,
        tokenExpired: tokenExpired,
        authProvider: authProvider,
        setAuthParams: setAuthParams,
        resetAuthParams: resetAuthParams,
        getAuthorizationHeader: getAuthorizationHeader,
        handleAccessDenied: handleAccessDenied,
        refreshToken: refreshToken,

        isAuthenticated: isAuthenticated,
		signInOpened: signInOpened,
        isPermitted: isPermitted,
        checkAccess: checkAccess,

        isPermittedGetAllNotifications: isPermittedGetAllNotifications,
        isPermittedGetViewedNotifications: isPermittedGetViewedNotifications,
        isPermittedPostViewedNotifications: isPermittedPostViewedNotifications,

        // will add the various get{entity} grants here
        getCCGrant: getCCGrant,
        getFAGrant: getFAGrant,
        getIRGrant: getIRGrant,
        getPathwayGrant: getPathwayGrant,
        getSourceGrant: getSourceGrant,

        isPermittedCreateConceptset: isPermittedCreateConceptset,
        isPermittedReadConceptset: isPermittedReadConceptset,
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

        isPermittedViewCdmResults: isPermittedViewCdmResults,
        isPermittedViewProfiles: isPermittedViewProfiles,
        isPermittedViewProfileDates: isPermittedViewProfileDates,

        isPermittedAccessSource: isPermittedAccessSource,
        isPermittedReadSource: isPermittedReadSource,
        isPermittedCreateSource: isPermittedCreateSource,
        isPermittedEditSource: isPermittedEditSource,
        isPermittedDeleteSource: isPermittedDeleteSource,
        isPermittedCheckSourceConnection: isPermittedCheckSourceConnection,
        isPermittedGetSourceDaimonPriority: isPermittedGetSourceDaimonPriority,

        isPermittedGetExecutionService: isPermittedGetExecutionService,

        isPermittedImportUsers,
        hasSourceAccess,
        isPermittedRunAs,
        isPermittedTagsManagement,
        isPermittedClearServerCache,
        isPermittedViewDataSourceReport,
        isPermittedViewDataSourceReportDetails,

        isPermittedConceptSetAnnotationsDelete,
        
        loadUserInfo,
        TOKEN_HEADER,
        runAs,
        executeWithRefresh,

    };

    return api;
});
