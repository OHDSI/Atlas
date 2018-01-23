define(['knockout', 'text!./loading.html', 'appConfig'], function (ko, view, config) {
	function loading(params) {
		var self = this;
		self.status = params.status || 'loading';
        self.isLightTheme = params.theme === 'light';
    }

	var component = {
		viewModel: loading,
		template: view
	};

	ko.components.register('loading', component);
	return component;
});
