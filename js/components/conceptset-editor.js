define(['knockout', 'text!./conceptset-editor.html', 'databindings', 'bootstrap','faceted-datatable'], function (ko, view) {
	function conceptsetEditor(params) {
		var self = this;
		self.model = params.model;
		self.conceptSetName = ko.observable();
		self.conceptSets = params.$raw.conceptSets();
        self.conceptSetId = params.$raw.conceptSetId;

		self.renderLink = function (s, p, d) {
			return '<a href=\"#/conceptset/' + d.id + '/details\">' + d.name + '</a>';
		}
	}

	var component = {
		viewModel: conceptsetEditor,
		template: view
	};

	ko.components.register('conceptset-editor', component);
	return component;
});
