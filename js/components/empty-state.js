define([
	'knockout',
	'text!./empty-state.html',
  'providers/Component',
	'less!./empty-state.less',
], function (
	ko,
	view,
	Component
) {
	class EmptyState extends Component {
		constructor() {
			super();
			this.name = 'empty-state';
			this.view = view;
		}

		render(params) {
			super.render(params);
			this.message = params.message || 'No data';

			return this;
		}
  }

	const emptyState = new EmptyState();
	return emptyState.build();
});
