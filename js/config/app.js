define(function () {
	var appConfig = {};

	// default configuration
	appConfig.api = {
		name: 'Local',
		url: 'http://localhost:8080/WebAPI/'
  };
  appConfig.cacheSources = false;
  appConfig.pollInterval = 60000;
  appConfig.useBundled3dPartyLibs = false;
	appConfig.cohortComparisonResultsEnabled = false;
	appConfig.userAuthenticationEnabled = false;
	appConfig.plpResultsEnabled = false;
	appConfig.useExecutionEngine = false;
	appConfig.viewProfileDates = false;
  appConfig.enableCosts = false;
	appConfig.supportUrl = "https://github.com/ohdsi/atlas/issues";
	appConfig.supportMail = "atlasadmin@your.org";
	appConfig.authProviders = [
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
  appConfig.xssOptions = {
    "whiteList": {
      "a": ["href", "class", "data-bind"],
			"button": ["class", "type"],
      "span": ["class", "data-bind"],
      "i": ["class", "id", "aria-hidden"],
      "div": ["class", "style", "id"],
      "option": ["value"],
      "input": ["type", "class"],
      "ui": ["class"],
      "path": ["d", "class"],
      "br": "",
    },
    "stripIgnoreTag": true,
    "stripIgnoreTagBody": ['script'],
  };
  appConfig.cemOptions = {
    "evidenceLinkoutSources": ["medline_winnenburg","splicer"],
    "sourceRestEndpoints": {
      "medline_winnenburg": "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={@ids}&retmode=json&tool=ohdsi_atlas&email=admin@ohdsi.org",
    },
    "externalLinks": {
      "medline_winnenburg": "https://www.ncbi.nlm.nih.gov/pubmed/{@id}",
      "splicer": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid={@id}"
    },
  };
  appConfig.enableTermsAndConditions = true;
	
	appConfig.webAPIRoot = appConfig.api.url;
	
	return appConfig;
});
