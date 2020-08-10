define(['knockout'], function(ko){

  const WarningSeverity = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    CRITICAL: 'CRITICAL',
  }

  const WarningSeverityIcon = {
    INFO: 'fa-info',
    WARNING: 'fa-warning',
    CRITICAL: 'fa-times-circle',
  };

  return {
    WarningSeverity,
    WarningSeverityIcon,
  };

});