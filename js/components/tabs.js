define([
	'knockout',
	'text!./tabs.html',
	'providers/Component',
	'less!./tabs.less',
], function (
	ko,
	view,
	Component
) {
	class Tabs extends Component {
		static get name() {
			return 'tabs';
		}

		static get view() {
			return view;
		}

		constructor(params) {
			super(params);
			this.selectedTab = ko.observable(0);
			this.tabs = ko.observableArray(params.tabs || []);
		}
  }

	return Component.build(Tabs);
});
