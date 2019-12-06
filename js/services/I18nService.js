define(function(require, exports){

	const config = require('appConfig');
	const http = require("services/http");
	const sharedState = require('atlas-state');

	function getCurrentLocale() {
		return localStorage.locale && localStorage.locale !== 'null' ? localStorage.locale : config.defaultLocale;
	}

	function getLocale(locale) {

		return http.doGet(`${config.webAPIRoot}i18n?lang=${locale}`)
			.then(({data}) => sharedState.localeSettings(data));
	}

	async function changeLocale(locale) {
		localStorage.locale = locale;
		await getLocale(locale);
	}

	function getAvailableLocales() {

		return http.doGet(`${config.webAPIRoot}i18n/locales`)
			.then(({data}) => {
				sharedState.availableLocales(data);
				const locale = getCurrentLocale();
				sharedState.locale(locale);
				changeLocale(locale);
				sharedState.locale.subscribe(l => changeLocale(l));
			});
	}

	return {
		getAvailableLocales,
		getLocale,
	};
});