define([
	'knockout',
	'text!./ac-access-denied.html',
	'components/Component',
	'utils/CommonUtils',
	'forbidden',
	'unauthenticated',
	'less!./ac-access-denied.less'
], function (
	ko,
	view,
	Component,
	commonUtils
) {
	class AccessDenied extends Component {
		constructor(params) {
			super(params);
			this.isAuthenticated = params.isAuthenticated;
		}
	}

	return commonUtils.build('access-denied', AccessDenied, view);
});
