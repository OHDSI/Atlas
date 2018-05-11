define([
	'knockout',
  'pages/data-sources/classes/Chart',
  'atlascharts',
], function (
  ko,
  Chart,
  atlascharts,
) {
  class Trellisline extends Chart {
    constructor() {
      super();
      this.name = 'trellisline';
      this.chart = new atlascharts.trellisline();
    }

    render(params) {
      super.render(params);
      return this;
    }
  }

  const viewModel = new Trellisline();  
	return viewModel.build();
});
