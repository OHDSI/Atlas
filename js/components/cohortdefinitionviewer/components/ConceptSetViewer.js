define(['knockout','text!./ConceptSetViewerTemplate.html'], function (ko, template) {

	const MAX_SIZE = 10;

	function ConceptSetViewer(params) {
		var self = this;
		self.conceptSet = params.conceptSet;
		self.currentItems = ko.observable(params.conceptSet.expression.items.slice(0, MAX_SIZE));
		self.showAll = ko.observable(false);
		self.buttonText = ko.computed(() => self.showAll() ? 'Show ' + MAX_SIZE : 'Show All');
		self.switchShowAll = () => {
			self.showAll(!self.showAll());
			self.currentItems(self.showAll()
				? self.conceptSet.expression.items.slice(0)
				: self.conceptSet.expression.items.slice(0, MAX_SIZE));
		}
	}

	// return compoonent definition
	return {
		viewModel: ConceptSetViewer,
		template: template
	};
});