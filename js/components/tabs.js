define([
	'knockout',
	'text!./tabs.html',
	'providers/Component',
	'components/tab',
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

		render(params) {
			super.render(params);
			this.tabs = params.tabs || [];
			this.context = params.context;
			
			return this;
		}
  }

	const tabs = new Tabs();
	return tabs.build();
});
