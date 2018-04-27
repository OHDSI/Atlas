define([
	'knockout',
  'pages/data-sources/Chart',
  'atlascharts',
], function (
  ko,
  Chart,
  atlascharts,
) {
  class Donut extends Chart {
    constructor() {
      super();
      this.chart = new atlascharts.donut();
    }

    render(params) {
      super.render(params);
      return this;
    }
  }

  const viewModel = new Donut();  
	var component = {
		viewModel,
		template: viewModel.template,
	};

	ko.components.register('donut', component);
	return component;
});
