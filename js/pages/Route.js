define([
	'knockout',
	'appConfig',
	'services/AuthAPI',
], function (
	ko,
	appConfig,
	authApi
) {
	class Route {
		checkPermission() {
			if (
				appConfig.userAuthenticationEnabled &&
				((authApi.token() != null && authApi.tokenExpirationDate() > new Date()) ||
					authApi.authProvider() === authApi.AUTH_PROVIDERS.IAP)
			) {
				return authApi.refreshToken();
			}
			return Promise.resolve();
		}

		constructor(handler) {
			this.handler = handler;
			this.isSecured = false;
		}

		handler() {
			throw new Exception('Handler should be overriden');
		}
	}

	class AuthorizedRoute extends Route {
		constructor(props) {
			super(props);
			this.isSecured = true;
		}

		checkPermission() {
			if (appConfig.userAuthenticationEnabled && authApi.subject() === undefined) {
				return this.waitForSubject();
			} else if (appConfig.userAuthenticationEnabled && authApi.subject() === null) {
				return Promise.reject();
			} else {
				return super.checkPermission();
			}
		}

		waitForSubject() {
			return new Promise((resolve, reject) => {
				authApi.subject.subscribe((subject) => {
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
