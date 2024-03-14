define([], function () {
	var configLocal = {};

	if ("${ATLAS_CLEAR_LOCAL_STORAGE}" == "true") {
		localStorage.clear();
	}

	var webapi_url = "${WEBAPI_URL}";
	
	if ("${USE_DYNAMIC_WEBAPI_URL}" == "true") {
		var getUrl = window.location;
	    webapi_url = getUrl.protocol + "//" + getUrl.hostname + "${DYNAMIC_WEBAPI_SUFFIX}";
	}

	// WebAPI
	configLocal.api = {
		name: '${ATLAS_INSTANCE_NAME}',
		url: webapi_url
	};

	configLocal.cohortComparisonResultsEnabled = ("${ATLAS_COHORT_COMPARISON_RESULTS_ENABLED}" == "true");
	configLocal.plpResultsEnabled = ("${ATLAS_PLP_RESULTS_ENABLED}" === "true");
	configLocal.userAuthenticationEnabled = ("${ATLAS_USER_AUTH_ENABLED}" === "true");
	configLocal.authProviders = [];
	configLocal.disableBrowserCheck = ("${ATLAS_DISABLE_BROWSER_CHECK}" === "true");
	configLocal.enablePermissionManagement = ("${ATLAS_ENABLE_PERMISSIONS_MGMT}" === "true");
	configLocal.cacheSources = ("${ATLAS_CACHE_SOURCES}" === "true");
	configLocal.enableSkipLogin = ("${ATLAS_SKIP_LOGIN}" === "true"); // automatically opens login window when user is not authenticated
	configLocal.useExecutionEngine = ("${ATLAS_USE_EXECUTION_ENGINE}" === "true");
	configLocal.viewProfileDates = ("${ATLAS_VIEW_PROFILE_DATES}" === "true");
	configLocal.enableCosts = ("${ATLAS_ENABLE_COSTS}" === "true");
	configLocal.supportUrl = "${ATLAS_SUPPORT_URL}";
	configLocal.supportMail = "${ATLAS_SUPPORT_MAIL}";
	configLocal.feedbackContacts = "${ATLAS_FEEDBACK_CONTACTS}";
	configLocal.feedbackCustomHtmlTemplate = "${ATLAS_FEEDBACK_HTML}";
	configLocal.companyInfoCustomHtmlTemplate = "${ATLAS_COMPANYINFO_HTML}";
	configLocal.showCompanyInfo = ("${ATLAS_COMPANYINFO_SHOW}" === "true");
	configLocal.defaultLocale = "${ATLAS_DEFAULT_LOCALE}";
	configLocal.pollInterval = parseInt("${ATLAS_POLL_INTERVAL}");


	if ("${ATLAS_SECURITY_WIN_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${ATLAS_SECURITY_WIN_PROVIDER_NAME}",
			url: "${ATLAS_SECURITY_WIN_PROVIDER_URL}",
			ajax: ("${ATLAS_SECURITY_WIN_PROVIDER_AJAX}" === "true"),
			icon: "${ATLAS_SECURITY_WIN_PROVIDER_ICON}",
		});
	}

	if ("${ATLAS_SECURITY_KERB_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${ATLAS_SECURITY_KERB_PROVIDER_NAME}",
			url: "${ATLAS_SECURITY_KERB_PROVIDER_URL}",
			ajax: ("${ATLAS_SECURITY_KERB_PROVIDER_AJAX}" === "true"),
			icon: "${ATLAS_SECURITY_KERB_PROVIDER_ICON}",
		});
	}

	if ("${ATLAS_SECURITY_OID_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${ATLAS_SECURITY_OID_PROVIDER_NAME}",
			url: "${ATLAS_SECURITY_OID_PROVIDER_URL}",
			ajax: ("${ATLAS_SECURITY_OID_PROVIDER_AJAX}" === "true"),
			icon: "${ATLAS_SECURITY_OID_PROVIDER_ICON}",
		});
	}

	if ("${ATLAS_SECURITY_GGL_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${ATLAS_SECURITY_GGL_PROVIDER_NAME}",
			url: "${ATLAS_SECURITY_GGL_PROVIDER_URL}",
			ajax: ("${ATLAS_SECURITY_GGL_PROVIDER_AJAX}" === "true"),
			icon: "${ATLAS_SECURITY_GGL_PROVIDER_ICON}",
		});
	}

	if ("${ATLAS_SECURITY_FB_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${ATLAS_SECURITY_FB_PROVIDER_NAME}",
			url: "${ATLAS_SECURITY_FB_PROVIDER_URL}",
			ajax: ("${ATLAS_SECURITY_FB_PROVIDER_AJAX}" === "true"),
			icon: "${ATLAS_SECURITY_FB_PROVIDER_ICON}",
		});
	}

	if ("${ATLAS_SECURITY_GH_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${ATLAS_SECURITY_GH_PROVIDER_NAME}",
			url: "${ATLAS_SECURITY_GH_PROVIDER_URL}",
			ajax: ("${ATLAS_SECURITY_GH_PROVIDER_AJAX}" === "true"),
			icon: "${ATLAS_SECURITY_GH_PROVIDER_ICON}",
		});
	}

	if ("${ATLAS_SECURITY_DB_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${ATLAS_SECURITY_DB_PROVIDER_NAME}",
			url: "${ATLAS_SECURITY_DB_PROVIDER_URL}",
			ajax: ("${ATLAS_SECURITY_DB_PROVIDER_AJAX}" === "true"),
			icon: "${ATLAS_SECURITY_DB_PROVIDER_ICON}",
			isUseCredentialsForm: ("${ATLAS_SECURITY_DB_PROVIDER_CREDFORM}" === "true")
		});
	}

	if ("${ATLAS_SECURITY_LDAP_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${ATLAS_SECURITY_LDAP_PROVIDER_NAME}",
			url: "${ATLAS_SECURITY_LDAP_PROVIDER_URL}",
			ajax: ("${ATLAS_SECURITY_LDAP_PROVIDER_AJAX}" === "true"),
			icon: "${ATLAS_SECURITY_LDAP_PROVIDER_ICON}",
			isUseCredentialsForm: ("${ATLAS_SECURITY_LDAP_PROVIDER_CREDFORM}" === "true")
		});
	}

	if ("${ATLAS_SECURITY_SAML_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${ATLAS_SECURITY_SAML_PROVIDER_NAME}",
			url: "${ATLAS_SECURITY_SAML_PROVIDER_URL}",
			ajax: ("${ATLAS_SECURITY_SAML_PROVIDER_AJAX}" === "true"),
			icon: "${ATLAS_SECURITY_SAML_PROVIDER_ICON}",
		});
	}

	// For existing broadsea implementations
	if ("${ATLAS_SECURITY_PROVIDER_ENABLED}" === "true") {
		configLocal.authProviders.push(openIdProvider = {
			name: "${ATLAS_SECURITY_PROVIDER_NAME}",
			url: "user/login/${ATLAS_SECURITY_PROVIDER_TYPE}",
			ajax: ("${ATLAS_SECURITY_PROVIDER_AJAX}" === "true"),
			icon: "${ATLAS_SECURITY_PROVIDER_ICON}",
		});
	}

	configLocal.enableTermsAndConditions = ("${ATLAS_ENABLE_TANDCS}" === "true");
	configLocal.enablePersonCount = ("${ATLAS_ENABLE_PERSONCOUNT}" === "true");
	configLocal.enableTaggingSection = ("${ATLAS_ENABLE_TAGGING_SECTION}" === "true");
	configLocal.refreshTokenThreshold = 1000 * 60 * parseInt("${ATLAS_REFRESH_TOKEN_THRESHOLD}");

	return configLocal;
});
