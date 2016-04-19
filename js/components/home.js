define(['knockout', 'text!./home.html'], function (ko, view) {
	function home(params) {
		var self = this;
	}

	var component = {
		viewModel: home,
		template: view
	};

	ko.components.register('home', component);
	return component;
});
