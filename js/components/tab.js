define([
	'knockout',
	'text!./tab.html',
  'providers/Component',
	'less!./tab.less',
], function (
	ko,
	view,
	Component
) {
	class Tab extends Component {
		constructor() {
			super();
			this.name = 'tab';
			this.view = view;
		}

		render(params, info) {
			super.render(params);

			return this;
		}
  }

	const tab = new Tab();
	return tab.build();
});
