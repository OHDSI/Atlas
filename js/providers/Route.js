define([
	'knockout',
	'appConfig',
	'services/AuthService',
], function (
	ko,
	appConfig,
	AuthService
) {
	class Route {
		checkPermission() {
			if (appConfig.userAuthenticationEnabled && AuthService.token() != null && AuthService.tokenExpirationDate() > new Date()) {
				return AuthService.refreshToken();
			} else {
				return new Promise(resolve => resolve());
			}      
		}

		constructor(handler) {
			this.handler = handler;
		}

		handler() {
			throw new Exception('Handler should be overriden');
		}
	}

	class AuthorizedRoute extends Route {
		checkPermission() {
			if (appConfig.userAuthenticationEnabled && AuthService.subject() === undefined) {
				return this.waitForSubject();
			} else if (appConfig.userAuthenticationEnabled && AuthService.subject() === null) {
				return Promise.reject();
			} else {
				return super.checkPermission();
			}
		}

		waitForSubject() {
			return new Promise((resolve, reject) => {
				AuthService.subject.subscribe((subject) => {
					if (subject) {
						super.checkPermission()
							.then(() => resolve())
							.catch(() => reject());
					} else {
						reject();
					}
				});
			});
		}
	}


	return {
		Route,
		AuthorizedRoute,
	};
});
