define(['knockout'], function (ko) {

  const WIZARD_STEPS = {
    SOURCES: 'sources',
    MAPPING: 'mapping',
		IMPORT: 'import',
  };

  const SOURCES = {
    ACTIVE_DIRECTORY: "ad",
    LDAP: "ldap",
  };

  return {
    WIZARD_STEPS,
    SOURCES,
  };

});