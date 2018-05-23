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
		constructor() {
			super();
			this.name = 'tabs';
			this.view = view;
			this.selectedTab = ko.observable(0);
			this.tabs = ko.observableArray();
		}

		render(params, info) {
			super.render(params);
			this.tabs = info.templateNodes.filter(node => node.nodeName === 'TAB');
			
			return this;
		}
  }

	const tabs = new Tabs();
	return tabs.build();
});
