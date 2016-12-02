define(['knockout', 'text!./loading.html', 'appConfig'], function (ko, view, config) {
	function loading(params) {
		var self = this;
	}

	var component = {
		viewModel: loading,
		template: view
	};

	ko.components.register('loading', component);
	return component;
});