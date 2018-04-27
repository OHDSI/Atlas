define([
	'knockout',
  'pages/data-sources/Chart',
  'atlascharts',
], function (
  ko,
  Chart,
  atlascharts,
) {
  class Line extends Chart {
    constructor() {
      super();
      this.chart = new atlascharts.line();
    }

    render(params) {
      super.render(params);
      return this;
    }
  }

  const viewModel = new Line();  
	var component = {
		viewModel,
		template: viewModel.template,
	};

	ko.components.register('line', component);
	return component;
});
