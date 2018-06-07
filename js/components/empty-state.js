define([
	'knockout',
	'text!./empty-state.html',
	'providers/Component',
	'const',
	'less!./empty-state.less',
], function (
	ko,
	view,
	Component,
	helpers
) {
	class EmptyState extends Component {
		constructor(params) {
			super(params);
			this.message = params.message || 'No data';

			return this;
		}
  }

	return helpers.build(EmptyState, 'empty-state', view);
});
