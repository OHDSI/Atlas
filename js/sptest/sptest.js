define(['knockout', 'text!./sptest.html','lodash','components/scatterplot'], function (ko, view, _) {
	function sptest(params) {
		var self = this;
		self.model = params.model;
		self.data = ko.observableArray();
		self.stuff = ko.observable("hello");
		console.log('wassup');
	}

	var component = {
		viewModel: sptest,
		template: view
	};

	ko.components.register('sptest', component);
	return component;
});
