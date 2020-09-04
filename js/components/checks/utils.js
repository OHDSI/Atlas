define(['knockout', './const'], function(ko, consts){

  function renderSeverity(data){
    var icon = consts.WarningSeverityIcon[data];
    return icon ? '<i class="fa ' + icon + '"></i>' : "";
  }

   function renderMessage(value, c, data) {
    if ((data.type === 'ConceptSetWarning' && Number.isInteger(data.conceptSetId)) ||
      (data.type === 'IncompleteRuleWarning' && data.ruleName)) {
      return '<span class="warning-message">' + value +
        '</span><a class="btn-fix" data-bind="text: ko.i18n(\'components.checks.fixIt\', \'Fix It\')"></a>';
    } else {
      return value;
    }
  };

  const api = {
    renderMessage,
    renderSeverity,
  };

  return api;
});