define(['knockout', 'utils/CommonUtils', 'text!./conceptset-list-modal.html'], function (ko, commonUtils, template) {

	function ConceptSetListModal(params) {
		const self = this;
		self.title = params.title || 'Concept List';
		self.conceptSetList = params.conceptSetList;
		self.isShown = params.isShown;
		self.commonUtils = commonUtils;
	}
	const component = {
		viewModel: ConceptSetListModal,
		template: template
	};

	ko.components.register('conceptset-list-modal', component);

	return component;
});