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

			this.selectedTab = ko.computed(() => params.selectedTab ? params.selectedTab() : 0);
			this.tabs = ko.observableArray(params.tabs || []);

			this.selectTab = params.selectTab || (idx => this.selectedTab(idx));

			this.componentName = ko.computed(() => params.componentName ? params.componentName() : this.tabs()[this.selectedTab()].componentName);
            this.componentParams = ko.computed(() => params.componentParams ? params.componentParams() : this.tabs()[this.selectedTab()].componentParams);
		}
	}

	return commonUtils.build('tabs', Tabs, view);
});
