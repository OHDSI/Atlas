define([
	'knockout',
	'text!./reusable-design.html',
	'components/Component',
	'utils/CommonUtils',
	'../../const',
	'components/cohort/linked-cohort-list',
	'less!./reusable-design.less',
	'databindings'
], function (
	ko,
	view,
	Component,
	commonUtils,
) {
	class ReusableEditor extends Component {
		constructor(params) {
			super();
			this.params = params;
			this.design = params.design;
			this.isEditPermitted = params.isEditPermitted;
			this.canEditName = params.isEditPermitted();
		}
	}

	return commonUtils.build('reusable-design', ReusableEditor, view);
});
