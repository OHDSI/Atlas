define([
	'knockout',
	'text!./tabs.html',
	'components/Component',
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
			this.subscriptions = [];

			this.selectedTab = params.selectedTab ? params.selectedTab : ko.observable(0);
			this.tabs = ko.observableArray(params.tabs || []);

            if (params.selectedTabKey) {
                const selectedTabKeySubscr = params.selectedTabKey.subscribe(newKey => this.onSelectedTabKeyUpdate(newKey));
                this.subscriptions.push(selectedTabKeySubscr);
                this.onSelectedTabKeyUpdate(params.selectedTabKey());
            }
			this.selectTab = params.selectTab || ((idx, tabData) => this.selectedTab(idx, tabData));

			// User can go back and forwards between tabs - no need to re-initialize them each time
			this.previouslyLoadedTabs = typeof this.selectedTab() !== 'undefined' ? ko.observable([this.selectedTab()]) : ko.observable([]);
			this.selectedTab.subscribe(idx => {
				const indexes = this.previouslyLoadedTabs();
				if (indexes.indexOf(idx) === -1) {
					this.previouslyLoadedTabs([ ...indexes, idx ]);
				}
			});
		}

		onSelectedTabKeyUpdate(newVal) {
            let tabIdx = this.tabs().indexOf(this.tabs().find(t => t.key === newVal));
            this.selectedTab(tabIdx);
		}

		dispose() {
            this.subscriptions.forEach(s => s.dispose());
		}
	}

	return commonUtils.build('tabs', Tabs, view);
});
