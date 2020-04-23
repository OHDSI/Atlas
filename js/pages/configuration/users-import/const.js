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

  const JobExecution = {
    ONCE: 'ONCE',
    HOURLY: 'HOURLY',
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY',
    YEARLY: 'YEARLY'
  };

  const JobStatuses = {
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    STARTED: "STARTED",
    STARTING: "STARTING",
    STOPPED: "STOPPED",
    STOPPING: "STOPPING",
    UNKNOWN: "UNKNOWN",
  };

  const JobStatusLabels = {
    "COMPLETED": "Completed",
    "FAILED": "Failed",
    "STARTED": "Started",
    "STARTING": "Starting",
    "STOPPED": "Stopped",
    "STOPPING": "Stopping",
    "UNKNOWN": "Unknown",
  };

  const JobExecutionOptions = [
    {value: JobExecution.ONCE, label: 'Once'},
		{value: JobExecution.HOURLY, label: 'Hourly'},
    {value: JobExecution.DAILY, label: 'Daily'},
    {value: JobExecution.WEEKLY, label: 'Weekly'},
    {value: JobExecution.MONTHLY, label: 'Monthly'},
    {value: JobExecution.YEARLY, label: 'Annually'},
  ];

  const JobEndOptions = {
    NEVER: 'never',
    AFTER: 'after',
    ON: 'on',
  };

  return {
    WIZARD_STEPS,
    PROVIDERS,
    IMPORT_STATUS,
    Api,
    AuthenticationProviders,
    JobExecution,
    JobExecutionOptions,
    JobEndOptions,
    JobStatuses,
    JobStatusLabels,
  };

});