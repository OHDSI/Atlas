define(function(require, exports) {

		var $ = require('jquery');
		var config = require('appConfig');
		var ko = require('knockout');
		var cookieUtils = require('utils/CookieUtils');
		var TOKEN_HEADER = 'Bearer';
		var LOCAL_STORAGE_PERMISSIONS_KEY = "permissions";
		const Service = require('providers/Service');
		const AutoBind = require('providers/AutoBind');
		
		class AuthService extends AutoBind(Service) {
			get TOKEN_HEADER() {
				return TOKEN_HEADER;
			}

			constructor(props) {
					super(props);
					this.token = ko.observable();            
					this.subject = ko.observable();
					this.permissions = ko.observable();
					this.tokenExpired = ko.observable(false);
					this.refreshTokenPromise = null;
					this.tokenExpirationDate = ko.pureComputed(() => {
						if (!this.token()) {
							return null;
						}
						
						try {
							var expirationInSeconds = parseJwtPayload(token()).exp;
							return new Date(expirationInSeconds * 1000);
						} catch (e) {
							return new Date();
						}			
					});
					this.isAuthenticated = ko.computed(() => {
							if (!config.userAuthenticationEnabled) {
									return true;
							}
			
							return !!this.subject();
					});					
					
					if (localStorage.bearerToken && localStorage.bearerToken != 'null') {
						this.token(localStorage.bearerToken);
					} else {
						this.token(null);
					}
					this.authProviders = config.authProviders.reduce(function(result, current) {
						result[config.api.url + current.url] = current;
						return result;
					}, {});
					
					this.askLoginOnTokenExpire();

					this.tokenExpirationDate.subscribe(this.askLoginOnTokenExpire);
					this.token.subscribe(function(newValue) {
						localStorage.bearerToken = newValue;
						cookieUtils.setField("bearerToken", newValue);
					});
					
					window.addEventListener('storage', (event) => {
						if (event.storageArea === localStorage && localStorage.bearerToken !== this.token()) {
							this.token(localStorage.bearerToken);
						};
					}, false);
			
					
					// httpService itself depends on AuthService, so we can't use it here
					$.ajaxSetup({
						beforeSend: (xhr, settings) => {
								if (!this.authProviders[settings.url] && settings.url.startsWith(config.api.url)) {
										xhr.setRequestHeader('Authorization', this.getAuthorizationHeader());
								}
						}
					});
					
					if (config.userAuthenticationEnabled) {
						this.loadUserInfo();
					}
				}
								
				isPromisePending(p) {
					return p && typeof p === 'object' && typeof p.status === 'function' && p.status() === 'pending';
				}

				getServiceUrl () {
					return config.api.url;
				}

				loadUserInfo() {
					return $.ajax({
            url: config.api.url + 'user/me',
            method: 'GET',
            success: (info) => {
							this.subject(info.login);
							this.permissions(info.permissions.map(p => p.permission));
            },
            error: (err) => {
							console.log('User is not authed');
							this.subject(null);
            }
        	});
				}

				getAuthorizationHeader() {
					if (!this.token()) {
							return null;
					}
					return TOKEN_HEADER + ' ' + this.token();
				}
		
				askLoginOnTokenExpire() {
					let expirationTimeout;
					return () => {
						if (expirationTimeout) {
							clearTimeout(expirationTimeout);
						}
						if (!this.token()) {
							this.tokenExpired(false);
							return;
						}
						if (this.tokenExpirationDate() > new Date()) {
							this.tokenExpired(false);
							expirationTimeout = setTimeout(
								() => {
									this.tokenExpired(true);
									$('#myModal').modal('show');
									expirationTimeout = null;
								},
								this.tokenExpirationDate() - new Date()
							);
						} else {
							this.tokenExpired(true);
						}
					}
				}

				handleAccessDenied(xhr) {
					switch (xhr.status) {
						case 401:
							this.resetAuthParams();
							break;
						case 403:
							this.refreshToken();
							break;
						}
				}

				resetAuthParams() {
					this.token(null);
					this.subject(null);
					this.permissions(null);
				}
				
				refreshToken() {
					if (!this.isPromisePending(this.refreshTokenPromise)) {
						this.refreshTokenPromise = this.httpService.doGet(getServiceUrl() + "user/refresh");
						this.refreshTokenPromise.then(({ data, headers }) => {
							this.setAuthParams(headers.get(TOKEN_HEADER));
						});
						this.refreshTokenPromise.catch(() => {
							this.resetAuthParams();
						});
					}

			}

			setAuthParams(tokenHeader) {
				this.token(tokenHeader);
				this.loadUserInfo();
			}

		}		
		
		return new AuthService();
});
