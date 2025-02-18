define(['knockout', 'components/cohortbuilder/options', "components/cohortbuilder/utils", 'text!./ConditionEraTemplate.html'], function (ko, options, utils, template) {

	function ConditionEraViewModel(params) {
		
		var self = this;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.ConditionEra;
		self.options = options;

    self.indexMessage = ko.pureComputed(() => {
      var anyCondition = ko.i18n('components.conditionEra.anyConditionButton', 'Any Condition');
      var message = ko.i18n('components.conditionEra.returnText_1', 'The index date refers to the condition era of');
      var conceptSetName = utils.getConceptSetName(
        self.Criteria.CodesetId,
        self.expression.ConceptSets,
        anyCondition()
      );
      return `${message()} ${conceptSetName}.`;
    });
	}

	// return compoonent definition
	return {
		viewModel: ConditionEraViewModel,
		template: template
	};
});