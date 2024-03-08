define([], function () {
	var configLocal = {};

	if ("${CLEAR_LOCAL_STORAGE}" == "true") {
		localStorage.clear();
	}

	var webapi_url = "${WEBAPI_URL}";
	
	if ("${USE_DYNAMIC_WEBAPI_URL}" == "true") {
		var getUrl = window.location;
	    webapi_url = getUrl.protocol + "//" + getUrl.hostname + "${DYNAMIC_WEBAPI_SUFFIX}";
	}

	// WebAPI
	configLocal.api = {
		name: '${APP_NAME}',
		url: webapi_url
	};

	configLocal.cohortComparisonResultsEnabled = ("${COHORT_COMPARISON_RESULTS}" == "true");
	configLocal.plpResultsEnabled = ("${PLP_RESULTS}" === "true");
	configLocal.userAuthenticationEnabled = ("${USER_AUTHENTICATION}" === "true");
	configLocal.authProviders = [];
	configLocal.disableBrowserCheck = ("${DISABLE_BROWSER_CHECK}" === "true");
	configLocal.enablePermissionManagement = ("${ENABLE_PERMISSIONS_MGMT}" === "true");
	configLocal.cacheSources = ("${CACHE_SOURCES}" === "true");
	configLocal.enableSkipLogin = ("${SKIP_LOGIN}" === "true"); // automatically opens login window when user is not authenticated
	configLocal.useExecutionEngine = ("${USE_EXECUTION_ENGINE}" === "true");
	configLocal.viewProfileDates = ("${VIEW_PROFILE_DATES}" === "true");
	configLocal.enableCosts = ("${ENABLE_COSTS}" === "true");
	configLocal.supportUrl = "${SUPPORT_URL}";
	configLocal.supportMail = "${SUPPORT_MAIL}";
	configLocal.feedbackContacts = "${FEEDBACK_CONTACTS}";
	configLocal.feedbackCustomHtmlTemplate = "${FEEDBACK_HTML}";
	configLocal.companyInfoCustomHtmlTemplate = "${COMPANYINFO_HTML}";
	configLocal.showCompanyInfo = ("${COMPANYINFO_SHOW}" === "true");
	configLocal.defaultLocale = "${DEFAULT_LOCALE}";
	configLocal.pollInterval = parseInt("${POLL_INTERVAL}");


	if ("${WIN_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${WIN_PROVIDER_NAME}",
			url: "${WIN_PROVIDER_URL}",
			ajax: ("${WIN_PROVIDER_AJAX}" === "true"),
			icon: "${WIN_PROVIDER_ICON}",
		});
	}

	if ("${KERB_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${KERB_PROVIDER_NAME}",
			url: "${KERB_PROVIDER_URL}",
			ajax: ("${KERB_PROVIDER_AJAX}" === "true"),
			icon: "${KERB_PROVIDER_ICON}",
		});
	}

	if ("${OID_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${OID_PROVIDER_NAME}",
			url: "${OID_PROVIDER_URL}",
			ajax: ("${OID_PROVIDER_AJAX}" === "true"),
			icon: "${OID_PROVIDER_ICON}",
		});
	}

	if ("${GGL_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${GGL_PROVIDER_NAME}",
			url: "${GGL_PROVIDER_URL}",
			ajax: ("${GGL_PROVIDER_AJAX}" === "true"),
			icon: "${GGL_PROVIDER_ICON}",
		});
	}

	if ("${FB_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${FB_PROVIDER_NAME}",
			url: "${FB_PROVIDER_URL}",
			ajax: ("${FB_PROVIDER_AJAX}" === "true"),
			icon: "${FB_PROVIDER_ICON}",
		});
	}

	if ("${GH_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${GH_PROVIDER_NAME}",
			url: "${GH_PROVIDER_URL}",
			ajax: ("${GH_PROVIDER_AJAX}" === "true"),
			icon: "${GH_PROVIDER_ICON}",
		});
	}

	if ("${DB_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${DB_PROVIDER_NAME}",
			url: "${DB_PROVIDER_URL}",
			ajax: ("${DB_PROVIDER_AJAX}" === "true"),
			icon: "${DB_PROVIDER_ICON}",
			isUseCredentialsForm: ("${DB_PROVIDER_CREDFORM}" === "true")
		});
	}

	if ("${LDAP_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${LDAP_PROVIDER_NAME}",
			url: "${LDAP_PROVIDER_URL}",
			ajax: ("${LDAP_PROVIDER_AJAX}" === "true"),
			icon: "${LDAP_PROVIDER_ICON}",
			isUseCredentialsForm: ("${LDAP_PROVIDER_CREDFORM}" === "true")
		});
	}

	if ("${SAML_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${SAML_PROVIDER_NAME}",
			url: "${SAML_PROVIDER_URL}",
			ajax: ("${SAML_PROVIDER_AJAX}" === "true"),
			icon: "${SAML_PROVIDER_ICON}",
		});
	}

	configLocal.enableTermsAndConditions = ("${ENABLE_TANDCS}" === "true");
	configLocal.enablePersonCount = ("${ENABLE_PERSONCOUNT}" === "true");
	configLocal.enableTaggingSection = ("${ENABLE_TAGGING_SECTION}" === "true");
	configLocal.refreshTokenThreshold = 1000 * 60 * parseInt("${REFRESH_TOKEN_THRESHOLD}");

	return configLocal;
});
