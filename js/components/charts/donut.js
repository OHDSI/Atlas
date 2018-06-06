define([
	'knockout',
  'providers/Chart',
  'atlascharts',
], function (
  ko,
  Chart,
  atlascharts,
) {
  class Donut extends Chart {
    constructor() {
      super();
      this.name = 'donut';
      this.chart = new atlascharts.donut();
    }

    render(params) {
      super.render(params);
      return this;
    }
  }

  const viewModel = new Donut();  
	return viewModel.build();
});
