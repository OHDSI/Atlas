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
					viewModel: new searchTab.viewModel(params),
					template: searchTab.template
        },
        import: {
          viewModel: new importTab.viewModel(params),
          template: importTab.template
        },
			};

			return this;
		}
	}

	return Component.build(Vocabulary);
});
