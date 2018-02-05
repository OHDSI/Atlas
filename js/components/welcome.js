define(['knockout', 'text!./welcome.html', 'appConfig'], function (ko, view, appConfig) {
    function welcome(params) {
        var self = this;
        var authApi = params.model.authApi;
        self.token = authApi.token;
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
        self.isLoggedIn = ko.computed(function () {
            if (!self.token()) return null;
            return authApi.isAuthenticated();
        });
        self.status = ko.computed(function () {
            if (self.isInProgress())
                return "Please wait...";
            if (self.errorMsg())
                return self.errorMsg();
            if (self.isLoggedIn()) {
                return "Logged in as '" + self.login() + "' (exp: " + self.expiration() + ")";
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

        self.signinWithLoginPass = function(data) {
            self.isInProgress(true);
            $.ajax({
                method: 'POST',
                url: appConfig.webAPIRoot + self.authUrl(),
                data: {
                    login: data.elements.lg_username.value,
                    password: data.elements.lg_password.value
                },
                success: function (data, textStatus, jqXHR) {
                    var token = jqXHR.getResponseHeader('Bearer');
                    setToken(token);
                    self.isBadCredentials(false);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    setToken(null);
                    self.isBadCredentials(true);
                    self.errorMsg("Login failed.");
                },
                complete: function (data) {
                    self.isInProgress(false);
                }
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
                        success: function (data, textStatus, jqXHR) {
                            var token = jqXHR.getResponseHeader('Bearer');
                            setToken(token);
                            self.isBadCredentials(false);
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            setToken(null);
                            self.errorMsg("Login failed.");
                            self.isBadCredentials(true);
                        },
                        complete: function (data) {
                            self.isInProgress(false);
                        }
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
                headers: {
                    Authorization: self.getAuthorizationHeader()
                },
                statusCode: {
                    401: function () {
                        setToken(null);
                    }
                },
                success: function (data, textStatus, jqXHR) {
                    setToken(null);
                },
                complete: function (data) {
                    self.isInProgress(false);
                }
            });
        };

        var setToken = function (token) {
            self.token(token);
            self.errorMsg(null);
        };
    }

    var component = {
        viewModel: welcome,
        template: view
    };

    ko.components.register('welcome', component);
    return component;
});
