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
		static get name() {
			return 'empty-state';
		}

		static get view() {
			return view;
		}

		constructor(params) {
			super(params);
			this.message = params.message || 'No data';

			return this;
		}
  }

	return Component.build(EmptyState);
});
