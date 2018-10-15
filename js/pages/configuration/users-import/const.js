define([
  'knockout',
  'appConfig'
], function (
  ko,
  config
) {

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

  const AuthenticationProviders = [
    { value: PROVIDERS.ACTIVE_DIRECTORY, label: "Active Directory" },
    { value: PROVIDERS.LDAP, label: "LDAP" },
  ];

  const IMPORT_STATUS = {
    NEW_USER: 'New user',
    MODIFIED: 'Modified',
    EXISTS: 'Already exist',
    UNKNOWN: 'Unknown',
  };

  const Api = {
    userImportJob: config.webAPIRoot + 'user/import/job',
  };

  const JobExecutionOptions = [
    {value: 'ONCE', label: 'Once'},
		{value: 'HOURLY', label: 'Hourly'},
    {value: 'DAILY', label: 'Daily'},
    {value: 'WEEKLY', label: 'Weekly'},
    {value: 'MONTHLY', label: 'Monthly'},
    {value: 'YEARLY', label: 'Annually'},
  ];

  return {
    WIZARD_STEPS,
    PROVIDERS,
    IMPORT_STATUS,
    Api,
    AuthenticationProviders,
    JobExecutionOptions,
  };

});