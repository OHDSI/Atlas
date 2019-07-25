define([
    'knockout',
    'text!./welcome.html',
    'appConfig',
    'services/AuthAPI',
	'utils/BemHelper',
    'less!welcome.less'
],
    function (
    ko,
    view,
    appConfig,
    authApi,
	BemHelper
    ) {
    const componentName = 'welcome';

    function welcome(params) {
        var self = this;
        const bemHelper = new BemHelper(componentName);
		this.classes = bemHelper.run.bind(bemHelper);
        self.token = authApi.token;
        self.loadUserInfo = authApi.loadUserInfo;
        self.setAuthParams = authApi.setAuthParams;
        self.resetAuthParams = authApi.resetAuthParams;
        self.serviceUrl = appConfig.webAPIRoot;
        self.errorMsg = ko.observable();
        self.isInProgress = ko.observable(false);
        self.login = authApi.subject;
        self.isDbLoginAtt = ko.observable(false);
        self.authUrl=ko.observable();
        self.isBadCredentials=ko.observable(false);
        self.expiration = ko.computed(function () {
            var expDate = authApi.tokenExpirationDate();
            return expDate
                ? expDate.toLocaleString()
                : null;
        });
        self.tokenExpired = authApi.tokenExpired;
        self.isLoggedIn = authApi.isAuthenticated;
			  self.isPermittedRunAs = ko.computed(() => self.isLoggedIn() && authApi.isPermittedRunAs());
        self.runAsLogin = ko.observable();
		self.isGoogleIapAuth = ko.computed(() => authApi.authProvider() === authApi.AUTH_PROVIDERS.IAP);
        self.status = ko.computed(function () {
            if (self.isInProgress())
                return "Please wait...";
            if (self.errorMsg())
                return self.errorMsg();
            if (self.isLoggedIn()) {
                if (self.expiration()) {
                    return "Logged in as '" + self.login() + "' (exp: " + self.expiration() + ")";
                } else {
                    return "Logged in as '" + self.login() + "'";
                }
            }
            return 'Not logged in';
        });
        self.authProviders = appConfig.authProviders;

        self.getAuthProvider = name => self.authProviders.filter(ap => ap.name === name)[0];

        self.toggleCredentialsForm =function () {
            self.isDbLoginAtt(!self.isDbLoginAtt());
        };

        self.getAuthorizationHeader = function() {
            return "Bearer " + self.token();
        };

        self.onLoginSuccessful = function(data, textStatus, jqXHR) {
            self.setAuthParams(jqXHR.getResponseHeader(authApi.TOKEN_HEADER), data.permissions);
            self.loadUserInfo().then(() => {
                self.errorMsg(null);
                self.isBadCredentials(null);
                self.isInProgress(false);
            })
        };

        self.onLoginFailed = function(jqXHR, defaultMessage) {
            self.isInProgress(false);
            self.resetAuthParams();
            self.isBadCredentials(true);
            const msg = jqXHR.getResponseHeader('x-auth-error');
            self.errorMsg(msg || defaultMessage);
        };

        self.signinWithLoginPass = function(data) {
            self.isInProgress(true);
            $.ajax({
                method: 'POST',
                url: appConfig.webAPIRoot + self.authUrl(),
                data: {
                    login: data.elements.lg_username.value,
                    password: data.elements.lg_password.value
                },
                success: self.onLoginSuccessful,
                error: (jqXHR, textStatus, errorThrown) => self.onLoginFailed(jqXHR, 'Bad credentials'),
            });
        };

        self.signin = function (name) {
            if(self.getAuthProvider(name).isUseCredentialsForm){
                self.authUrl(self.getAuthProvider(name).url);
                self.toggleCredentialsForm();
            }
            else {
                var authProvider = self.getAuthProvider(name);
                var loginUrl = self.serviceUrl + authProvider.url;

            if (authProvider.ajax == true) {
                self.isInProgress(true);
                $.ajax({
                    url: loginUrl,
                    xhrFields: {
                        withCredentials: true
                    },
                    success: self.onLoginSuccessful,
                    error: (jqXHR, textStatus, errorThrown) => self.onLoginFailed(jqXHR, 'Login failed'),
                });
            } else {
                document.location = loginUrl;
            }
         }
     };

        self.signout = function () {
            self.isInProgress(true);
            $.ajax({
                url: self.serviceUrl + "user/logout",
                method: 'GET',
                statusCode: {
                    401: function () {
                        self.resetAuthParams();
                    }
                },
                success: function (data, textStatus, jqXHR) {
                    self.resetAuthParams();
                },
                complete: function (data) {
                    self.errorMsg(null);
                    self.isInProgress(false);
                }
            });
        };

        self.runAs = function() {
          self.isInProgress(true);
          const xhr =  authApi.runAs(self.runAsLogin(), self.onLoginSuccessful, (jqXHR, textStatus, errorThrown) => {
						const msg = jqXHR.getResponseHeader('x-auth-error');
						self.isInProgress(false);
						self.errorMsg(msg || "User was not found");
					});
        };

        self.signoutIap = function () {
            window.location = '/_gcp_iap/clear_login_cookie';
        }

        self.refreshPage = function () {
            window.location.reload();
        }
    }

    var component = {
        viewModel: welcome,
        template: view
    };

    ko.components.register(componentName, component);
    return component;
});
