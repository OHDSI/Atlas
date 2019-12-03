define(function(require, exports){

	const config = require('appConfig');
	const http = require("services/http");
	const sharedState = require('atlas-state');

	function getCurrentLocale() {
		return localStorage.locale && localStorage.locale !== 'null' ? localStorage.locale : config.defaultLocale;
	}

	function getAvailableLocales() {

		return http.doGet(`${config.webAPIRoot}i18n/locales`)
			.then(({data}) => {
				sharedState.availableLocales(data);
				const locale = getCurrentLocale();
				sharedState.locale.subscribe(l => localStorage.locale = l);
				sharedState.locale(locale);
			});
	}

	function getLocale(locale) {

		return http.doGet(`${config.webAPIRoot}i18n?lang=${locale}`);
	}

	return {
		getAvailableLocales,
		getLocale,
	};
});