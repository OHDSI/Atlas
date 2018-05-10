define([
	'knockout',
  'pages/data-sources/Chart',
  'atlascharts',
], function (
  ko,
  Chart,
  atlascharts,
) {
  class Boxplot extends Chart {
    constructor() {
      super();
      this.chart = new atlascharts.boxplot();
    }

    render(params) {
      super.render(params);
      return this;
    }
  }

  const viewModel = new Boxplot();  
	var component = {
		viewModel,
		template: viewModel.template,
	};

	ko.components.register('boxplot', component);
	return component;
});
