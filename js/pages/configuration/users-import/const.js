define(['knockout'], function (ko) {

  const WIZARD_STEPS = {
    PROVIDERS: 'providers',
    MAPPING: 'mapping',
		IMPORT: 'import',
  };

  const PROVIDERS = {
    ACTIVE_DIRECTORY: "ad",
    LDAP: "ldap",
  };

  return {
    WIZARD_STEPS,
    PROVIDERS,
  };

});