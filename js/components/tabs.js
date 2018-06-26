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
			this.selectedTab = ko.observable(0);
			this.tabs = ko.observableArray(params.tabs || []);
		}
	}

	return commonUtils.build('tabs', Tabs, view);
});
