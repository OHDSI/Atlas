define([
	'knockout',
	'text!./tabs.html',
	'providers/Component',
	'utils/CommonUtils',
	'less!./tabs.less',
], function (
	ko,
	view,
	Component,
	commonUtils
) {
	class Tabs extends Component {
		constructor(params) {
			super(params);

			this.selectedTab = ko.observable(params.selectedTab ? params.selectedTab() : 0);
			this.tabs = ko.observableArray(params.tabs || []);

			this.selectTab = params.selectTab || (idx => this.selectedTab(idx));

			this.componentName = params.componentName || ko.computed(() => this.tabs()[this.selectedTab()].componentName);
            this.componentParams = params.componentParams || ko.computed(() => this.tabs()[this.selectedTab()].componentParams);
		}
	}

	return commonUtils.build('tabs', Tabs, view);
});
