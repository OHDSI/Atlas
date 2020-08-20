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
			const entity = params.entity;
			this.createdBy = entity.createdBy ? (entity.createdBy.name ? entity.createdBy.name : entity.createdBy) : '';
			this.createdDate = entity.createdDate;
			this.modifiedBy = entity.modifiedBy ? (entity.modifiedBy.name ? entity.modifiedBy.name : entity.modifiedBy) : '';
			this.modifiedDate = entity.modifiedDate;
		}
	}

	return commonUtils.build('authorship', Authorship, view);
});