define([
	'knockout',
  'pages/data-sources/Chart',
  'atlascharts',
], function (
  ko,
  Chart,
  atlascharts,
) {
  class Trellisline extends Chart {
    constructor() {
      super();
      this.chart = new atlascharts.trellisline();
    }

    render(params) {
      super.render(params);
      return this;
    }
  }

  const viewModel = new Trellisline();  
	var component = {
		viewModel,
		template: viewModel.template,
	};

	ko.components.register('trellisline', component);
	return component;
});
