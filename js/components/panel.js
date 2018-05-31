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
		static get name() {
			return 'panel';
		}

		static get view() {
			return view;
		}

		constructor(params) {
			super(params);
			this.title = params.title;
			this.templateId = params.templateId;
			this.context = params.context;
			
		}
  }

	return Component.build(Panel);
});
