define(['knockout', 'jquery', 'utils/CommonUtils', 'text!./concept-modal.html', 'databindings'], function (ko, $, commonUtils, template) {

	function ConceptSetListModal(params) {
		const self = this;
		self.title = params.title || 'Concept List';
		self.conceptSetList = params.conceptSetList;
		self.isShown = params.isShown;
		self.commonUtils = commonUtils;
		self.onNavigate = function() {
			// closes the modal when the concept link is clicked (causing a route change)
			// see: https://github.com/twbs/bootstrap/issues/489
			$('.modal.in').modal('hide');
		}
		self.tableOptions = commonUtils.getTableOptions('M');
	}
	const component = {
		viewModel: ConceptSetListModal,
		template: template
	};

	ko.components.register('conceptset-concept-modal', component);

	return component;
});