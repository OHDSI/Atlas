define([
	'knockout',
  'providers/Chart',
  'atlascharts',
], function (
  ko,
  Chart,
  atlascharts,
) {
  class Line extends Chart {
    constructor() {
      super();
      this.name = 'atlasline';
      this.chart = new atlascharts.line();
    }

    render(params) {
      super.render(params);
      return this;
    }
  }

  const viewModel = new Line();  
	return viewModel.build();
});
