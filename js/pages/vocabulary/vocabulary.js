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
  Component,
  searchTab,
  importTab
) {
	class Vocabulary extends Component {
		static get name() {
			return 'vocabulary';
		}

		static get view() {
			return view;
		}

		constructor(params) {
			super(params);
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

		}
	}

	return Component.build(Vocabulary);
});
