define([
	'knockout',
	'text!./panel.html',
  'providers/Component',
	'less!./panel.less',
], function (
	ko,
	view,
	Component
) {
	class Panel extends Component {
		constructor() {
			super();
			this.name = 'panel';
			this.view = view;
		}

		render(params) {
      super.render(params);
			this.title = params.title;
			this.templateId = params.templateId;
			this.context = params.context;
			
			return this;
		}
  }

	const panel = new Panel();
	return panel.build();
});
