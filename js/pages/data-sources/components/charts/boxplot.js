define([
	'knockout',
  'pages/data-sources/classes/Chart',
  'atlascharts',
], function (
  ko,
  Chart,
  atlascharts,
) {
  class Boxplot extends Chart {
    constructor() {
      super();
      this.name = 'boxplot';
      this.chart = new atlascharts.boxplot();
    }

    render(params) {
      super.render(params);
      return this;
    }
  }

  const viewModel = new Boxplot();  
	return viewModel.build();
});
