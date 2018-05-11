define([
	'knockout',
  'pages/data-sources/classes/Chart',
  'atlascharts',
], function (
  ko,
  Chart,
  atlascharts,
) {
  class Histogram extends Chart {
    constructor() {
      super();
      this.name = 'histogram';
      this.chart = new atlascharts.histogram();
    }

    render(params) {
      super.render(params);
      return this;
    }
  }

  const viewModel = new Histogram();  
	return viewModel.build();
});
