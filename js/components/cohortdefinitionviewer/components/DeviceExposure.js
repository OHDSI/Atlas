define(['knockout','components/cohortbuilder/options','components/cohortbuilder/utils', 'text!./DeviceExposureTemplate.html'
], function (ko, options, utils, template) {

	function DeviceExposureViewModel(params) {
		var self = this;

		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.DeviceExposure;
		self.options = options;

    self.indexMessage = ko.i18nformat(
      'components.conditionDevice.indexDataText',
      'The index date refers to the device exposure of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionDevice.anyDevice', 'Any Device')
        ))
      }
    );
		
	}

	// return compoonent definition
	return {
		viewModel: DeviceExposureViewModel,
		template: template
	};
});