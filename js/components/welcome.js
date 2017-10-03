define(['knockout', 'text!./welcome.html', 'appConfig'], function (ko, view, appConfig) {
    function welcome(params) {
        var self = this;
        var authApi = params.model.authApi;
        self.token = authApi.token;
        self.serviceUrl = appConfig.webAPIRoot;
        self.errorMsg = ko.observable();
        self.isInProgress = ko.observable(false);
        self.login = authApi.subject;
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
        self.authProviders = [
            {
                name: 'Windows',
                url: 'user/login',
                ajax: true,
								icon: 'fa fa-windows'
            },
            {
                name: 'Google',
                url: 'user/oauth/google',
                ajax: false,
								icon: 'fa fa-google'
            },
            {
                name: 'Facebook',
                url: 'user/oauth/facebook',
                ajax: false,
								icon: 'fa fa-facebook'
            },
        ];
        self.currentAuthProvider = ko.observable(self.authProviders[0]);

        self.getAuthorizationHeader = function() {
            return "Bearer " + self.token();
        };

        self.signin = function () {
			
			self.currentAuthProvider = ko.observable(this);
			
            var loginUrl = self.serviceUrl + self.currentAuthProvider().url;

            if (self.currentAuthProvider().ajax == true) {
                self.isInProgress(true);
                $.ajax({
                    url: loginUrl,
                    xhrFields: {
                        withCredentials: true
                    },
                    success: function (data, textStatus, jqXHR) {
                        var token = jqXHR.getResponseHeader('Bearer');
                        setToken(token);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        setToken(null);
                        self.errorMsg("Login failed.");
                    },
                    complete: function (data) {
                        self.isInProgress(false);
                    }
                });
            } else {
                document.location = loginUrl;
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
