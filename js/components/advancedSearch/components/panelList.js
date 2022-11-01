define([
	'knockout',
	'text!./panelList.html',
	'components/Component',
	'utils/CommonUtils',
	'less!./panel-list.less',
], function (
	ko,
	view,
	Component,
	commonUtils
) {
	class PanelList extends Component {
		constructor(params) {
			super(params);
			this.title = params.title;
			this.templateId = params.templateId;
			this.context = params.context;
			this.selectElement = params.selectElement;
			this.showText = params.panelCollapsable;
		}

		toggleShow() {
			this.showText(!this.showText());
		}
	}

	return commonUtils.build('panel-list', PanelList, view);
});
