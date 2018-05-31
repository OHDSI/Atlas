define([
	'knockout',
  './components/search',
	'text!./vocabulary.html',
	'appConfig',
  'providers/Component',
	'less!./vocabulary.less',
], function (
  ko,
  searchTab,
	view,
	config,
  Component,
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
        search: searchTab
			};
			console.log(searchTab)

			return this;
		}
	}

	const component = new Vocabulary();
	return component.build();
});
