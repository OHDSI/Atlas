define([
	'knockout',
	'text!./empty-state.html',
	//'less!./empty-state.less',
], function (
	ko,
	view,
) {
	function emptyState(params) {
    this.message = params.message || 'No data';
  }

	var component = {
		viewModel: emptyState,
		template: view,
	};

	ko.components.register('empty-state', component);
	return component;
});
