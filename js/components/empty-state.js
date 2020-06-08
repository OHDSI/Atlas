define([
	'knockout',
	'text!./empty-state.html',
	'components/Component',
	'utils/CommonUtils',
	'less!./empty-state.less',
], function (
	ko,
	view,
	Component,
	commonUtils
) {
	class EmptyState extends Component {
		constructor(params) {
			super(params);
			this.message = params.message || ko.i18n('common.noData', 'No data');

			return this;
		}
	}

	return commonUtils.build('empty-state', EmptyState, view);
});
