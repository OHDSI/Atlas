define(function(require, exports){

	const config = require('appConfig');
	const http = require("services/http");
	const sharedState = require('atlas-state');

	function getCurrentLocale() {
		// stored lang
		if (localStorage.locale && localStorage.locale !== 'null') {
			return localStorage.locale;
		}

		// default navigator lang
		const navigatorLang = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;
		if (navigatorLang && navigatorLang.length >= 2) {
			return navigatorLang.substr(0, 2); // ISO 639-1
		}

		return config.defaultLocale;
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