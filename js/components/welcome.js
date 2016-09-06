define(['knockout', 'text!./welcome.html', 'appConfig'], function (ko, view, appConfig) {
    function welcome(params) {
        var self = this;

        self.serviceUrl = appConfig.webAPIRoot;
        self.errorMsg = ko.observable();
        self.token = ko.observable();
        self.isInProgress = ko.observable(false);
        self.login = ko.computed(function () {
            if (self.token()) {
                var t = String(self.token());
                return parseJwtPayload(t).sub;
            } else {
                return null;
            }
        });
        self.tokenExpirationDate = function() {
            if (self.token()) {
                var expirationInSeconds = parseJwtPayload(self.token()).exp;
                var expirationDate = new Date(expirationInSeconds * 1000);
                return expirationDate;
            } else
                return null;
        };
        self.expiration = ko.computed(function () {
            var expDate = self.tokenExpirationDate();
            if (expDate) {
                return expDate.toLocaleString();
            } else {
                return null;
            }
        });
        self.isLoggedIn = ko.computed(function () {
            if (self.token()) {
                var exp = self.tokenExpirationDate();
                var now = new Date();
                var valid = now < exp;
                return valid;
            }

            return false;
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

        var fromatErrMsg = function(jqXHR, textStatus, errorThrown) {
            var msg = "";
            if (errorThrown) {
                msg += errorThrown;
            } else if (textStatus) {
                msg += textStatus;
            }

            if (jqXHR.responseText) {
                if (msg) {
                    msg += ": ";
                }
                msg += jqXHR.responseText;
            }

            return msg;
        };

        self.getAuthorizationHeader = function() {
            return "Bearer " + self.token();
        };

        self.signin = function () {
            self.isInProgress(true);
            $.ajax({
                url: self.serviceUrl + "user/login",
                method: 'GET',
                xhrFields: {
                    withCredentials: true
                },
                success: function (data, textStatus, jqXHR) {
                    var token = jqXHR.getResponseHeader('Bearer');
                    setToken(token);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    setToken(null);
                    self.errorMsg(fromatErrMsg(jqXHR, textStatus, errorThrown));
                },
                complete: function (data) {
                    self.isInProgress(false);
                }
            });
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
                error: function (jqXHR, textStatus, errorThrown) {
                    self.errorMsg(fromatErrMsg(jqXHR, textStatus, errorThrown));
                },
                complete: function (data) {
                    self.isInProgress(false);
                }
            });
        };

        var setToken = function (token) {
            if (token == "null") {
                token = null;
            }

            self.token(token);
            self.errorMsg(null);
            if (token) {
                localStorage.bearerToken = token;
            } else {
                localStorage.removeItem('bearerToken');
            }
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

        // check if token works
        if (localStorage.bearerToken && localStorage.bearerToken != "null") {
            self.isInProgress(true);
            $.ajax({
                url: self.serviceUrl + "user/loggedIn",
                method: 'GET',
                headers: {
                    Authorization: "Bearer " + localStorage.bearerToken
                },
                statusCode: {
                  401: function() {
                      setToken(null);
                  }  
                },
                success: function(data, textStatus, jqXHR) {
                    if (data == true) {
                        setToken(localStorage.bearerToken);
                    } else {
                        setToken(null);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    self.errorMsg(fromatErrMsg(jqXHR, textStatus, errorThrown));
                },
                complete: function(data) {
                    self.isInProgress(false);
                }
            });
        } else {
            setToken(null);
        }
    }

	var component = {
		viewModel: welcome,
		template: view
	};

	ko.components.register('welcome', component);
	return component;
});