define([
	'knockout',
	'text!./white-page.html',
	'providers/Component',
	'utils/CommonUtils',
	'unauthenticated',
	'less!./white-page.less',
], function (
	ko,
	view,
	Component,
	commonUtils,
	AuthService
) {
	class WhitePage extends Component {
		constructor(params) {
			super(params);
		}
	}

	return commonUtils.build('white-page', WhitePage, view);
});
