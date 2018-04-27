define([
	'knockout',
	'text!./report-title.html',
], function (
	ko,
	view,
) {
	function reportTitle(params) {
    this.name = params.name;
    this.sourceKey = params.sourceKey;
  }

	var component = {
		viewModel: reportTitle,
		template: view,
	};

	ko.components.register('report-title', component);
	return component;
});
