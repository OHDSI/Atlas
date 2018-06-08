define([
	'knockout',
	'text!./empty-state.html',
	'providers/Component',
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
			this.message = params.message || 'No data';

			return this;
		}
  }

	return commonUtils.build(EmptyState, 'empty-state', view);
});
