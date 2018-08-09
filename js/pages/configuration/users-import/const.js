define(['knockout'], function (ko) {

  const WIZARD_STEPS = {
    PROVIDERS: 'providers',
    MAPPING: 'mapping',
		IMPORT: 'import',
    FINISH: 'finish',
  };

  const PROVIDERS = {
    ACTIVE_DIRECTORY: "ad",
    LDAP: "ldap",
  };

  const IMPORT_STATUS = {
    NEW_USER: 'New user',
    MODIFIED: 'Modified',
    EXISTS: 'Already exist',
    UNKNOWN: 'Unknown',
  };

  return {
    WIZARD_STEPS,
    PROVIDERS,
    IMPORT_STATUS,
  };

});