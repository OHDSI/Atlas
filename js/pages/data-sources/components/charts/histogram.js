define([
	'knockout',
  'pages/data-sources/Chart',
  'atlascharts',
], function (
  ko,
  Chart,
  atlascharts,
) {
  class Histogram extends Chart {
    constructor() {
      super();
      this.chart = new atlascharts.histogram();
    }

    render(params) {
      super.render(params);
      return this;
    }
  }

  const viewModel = new Histogram();  
	var component = {
		viewModel,
		template: viewModel.template,
	};

	ko.components.register('histogram', component);
	return component;
});
