define(['knockout', 'text!./loading.html', 'appConfig', 'less!./loading.less'], function (ko, view, config) {
	function loading(params) {
		var self = this;
		self.status = params.status || 'loading';
		self.clazz = params.class || '';
	}

	var component = {
		viewModel: loading,
		template: view
	};

	ko.components.register('loading', component);
	return component;
});
