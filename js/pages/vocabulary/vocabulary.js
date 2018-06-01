define([
	'knockout',
  'text!./vocabulary.html',
  'providers/Component',
  './components/search',
  './components/import',
  'components/heading',
  'less!./vocabulary.less'
], function (
  ko,
	view,
	config,
  Component,
  searchTab,
  importTab
) {
	class Vocabulary extends Component {
		constructor() {
			super();
			this.name = 'vocabulary';
      this.view = view;      
    }    

		render(params, info) {
      super.render(params);
      this.tabs = {
        search: {
					viewModel: new searchTab.viewModel(),
					template: searchTab.template
        },
        import: {
          viewModel: new importTab.viewModel({ model: params.model }),
          template: importTab.template
        },
			};
			console.log(searchTab)

			return this;
		}
	}

	const component = new Vocabulary();
	return component.build();
});
