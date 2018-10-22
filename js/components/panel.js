define([
	'knockout',
	'text!./panel.html',
	'components/Component',
	'utils/CommonUtils',
	'less!./panel.less',
], function (
	ko,
	view,
	Component,
	commonUtils
) {
	class Panel extends Component {
		constructor(params) {
			super(params);
			this.title = params.title;
			this.templateId = params.templateId;
			this.context = params.context;			
		}
	}

	return commonUtils.build('panel', Panel, view);
});
