define([
	'knockout',
  './components/search',
	'text!./vocabulary.html',
  'providers/Component',
], function (
  ko,
  searchTab,
	view,
  Component,
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
				}
			};

		}
	}

	return Component.build(Vocabulary);
});
