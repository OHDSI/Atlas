define(['knockout', 'text!./user-bar.html', 'appConfig'], function (ko, view, appConfig) {
	function userBar(params) {
		var self = this;
		self.appConfig = appConfig;
	}

	var component = {
		viewModel: userBar,
		template: view
	};

	ko.components.register('user-bar', component);
	return component;
});