define([
	'knockout',
  'pages/data-sources/classes/Chart',
  'atlascharts',
], function (
  ko,
  Chart,
  atlascharts,
) {
  class Treemap extends Chart {
    constructor() {
      super();
      this.name = 'treemap';
      this.chart = new atlascharts.treemap();
    }

    render(params) {
      super.render(params);
      return this;
    }
  }

  const viewModel = new Treemap();  
	return viewModel.build();
});
