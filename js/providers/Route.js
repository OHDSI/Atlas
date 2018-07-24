define([
	'knockout',
	'appConfig',
	'webapi/AuthAPI',
], function (
	ko,
	appConfig,
	authApi
) {
	class Route {
		checkPermission() {
			if (appConfig.userAuthenticationEnabled && authApi.token() != null && authApi.tokenExpirationDate() > new Date()) {
				return authApi.refreshToken();
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
			if (authApi.token() === null) {
				return new Promise((resolve, reject) => reject());
			}
			return super.checkPermission();
		}
	}


	return {
		Route,
		AuthorizedRoute,
	};
});
