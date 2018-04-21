define(['knockout','text!./conceptset-list-modal.html'], function (ko, template) {

	function ConceptSetListModal(params) {
		const self = this;
		self.model = params.model;
		self.title = params.title || 'Concept List';
		self.conceptSetList = params.conceptSetList;
		self.isShown = params.isShown;
	}
	const component = {
		viewModel: ConceptSetListModal,
		template: template
	};
	
	ko.components.register('conceptset-list-modal', component);
	
	return component;
});