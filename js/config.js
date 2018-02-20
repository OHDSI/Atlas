define(['optional!config-local'], function (localConfig) {
	var config = {};
	if (JSON.stringify(localConfig) == JSON.stringify({})) {
		console.warn('Local configuration not found.  Using default values. To use a local configuration and suppress 404 errors, create a file called config-local.js under the /js directory');
	}

	// default configuration
	config.api = {
		name: 'Local',
		url: 'http://localhost:8080/WebAPI/'
	};
	config.cohortComparisonResultsEnabled = false;
	config.userAuthenticationEnabled = false;
	config.plpResultsEnabled = false;
	config.useExecutionEngine = false;
	config.supportUrl = "https://github.com/ohdsi/atlas/issues";
	config.authProviders = [
    {
      "name": "Windows",
      "url": "user/login/windows",
      "ajax": true,
      "icon": "fa fa-windows"
    },
    {
      "name": "Kerberos",
      "url": "user/login/kerberos",
      "ajax": true,
      "icon": "fa fa-windows"
    },
    {
      "name": "OpenID",
      "url": "user/login/openid",
      "ajax": false,
      "icon": "fa fa-openid"
    },
    {
      "name": "Google",
      "url": "user/oauth/google",
      "ajax": false,
      "icon": "fa fa-google"
    },
    {
      "name": "Facebook",
      "url": "user/oauth/facebook",
      "ajax": false,
      "icon": "fa fa-facebook"
    },
    {
      "name": "DB",
      "url": "user/login/db",
      "ajax": true,
      "icon": "fa fa-database",
      "isUseCredentialsForm":true
    },
    {
      "name": "LDAP",
      "url": "user/login/ldap",
      "ajax": true,
      "icon": "fa fa-cubes",
      "isUseCredentialsForm": true
    },
    {
      "name": "Active Directory LDAP",
      "url": "user/login/ad",
      "ajax": true,
      "icon": "fa fa-cubes",
      "isUseCredentialsForm": true
    }
  ];
  config.xssOptions = {
    "whiteList": {
      "a": ["href", "class"],
			"button": ["class", "type"],
      "span": ["class", "data-bind"],
      "i": ["class", "id", "aria-hidden"],
      "div": ["class", "style", "id"],
      "option": ["value"],
      "input": ["type", "class"],
      "ui": ["class"],
      "path": ["d", "class"]
    },
    "stripIgnoreTag": true,
    "stripIgnoreTagBody": ['script'],
  };

	Object.assign(config, localConfig);
	config.webAPIRoot = config.api.url;
	return config;
});