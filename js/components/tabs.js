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

			this.selectedTab = params.selectedTab ? params.selectedTab : ko.observable(0);
            this.tabs = ko.observableArray(params.tabs || []);

            // There can be nested components for a single tab, which will be displayed under parent tab
			this.selectedTitleIndex = ko.computed(() => {
				if (typeof this.tabs()[this.selectedTab()] === 'undefined') {
					return this.selectedTab();
				}
				return this.tabs()[this.selectedTab()].titleIndex || this.selectedTab()
            });

			this.selectTab = params.selectTab || (idx => this.selectedTab(idx));

			// User can go back and forwards between tabs - no need to re-initialize them each time
			this.previouslyLoadedTabs = this.selectedTab() ? ko.observable([this.selectedTab()]) : ko.observable([]);
            this.selectedTab.subscribe(idx => {
            	const indexes = this.previouslyLoadedTabs();
            	if (indexes.indexOf(idx) === -1) {
                    this.previouslyLoadedTabs([ ...indexes, idx ]);
				}
			});
		}
	}

	return commonUtils.build('tabs', Tabs, view);
});
