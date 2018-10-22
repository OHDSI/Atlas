define([
	'knockout',
	'text!./white-page.html',
	'components/Component',
	'utils/CommonUtils',
	'unauthenticated',
	'less!./white-page.less',
], function (
	ko,
	view,
	Component,
	commonUtils,
	authApi
) {
	class WhitePage extends Component {
		constructor(params) {
			super(params);
		}
	}

	return commonUtils.build('white-page', WhitePage, view);
});
