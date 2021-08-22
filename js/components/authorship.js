define([
	'knockout',
	'text!./authorship.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'less!./authorship.less'
], function (
	ko,
	view,
	Component,
	AutoBind,
	commonUtils
) {
	class Authorship extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.createdText = params.createdText || ko.i18n('components.authorship.created', 'created');
			this.createdBy = params.createdBy;
			this.createdDate = params.createdDate;
			this.modifiedBy = params.modifiedBy;
			this.modifiedDate = params.modifiedDate;
		}
	}

	return commonUtils.build('authorship', Authorship, view);
});