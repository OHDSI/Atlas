define([
	'knockout',
	'text!./heading.html',
	'providers/Component',
	'less!./heading.less'
], function (
	ko,
	view,
	Component
) {
	class Heading extends Component {
		static get name() {
			return 'heading-title';
		}

		static get view() {
			return view;
		}

		constructor(params) {
			super(params);
			this.title = params.name;
			this.sourceKey = params.sourceKey;
		}
  }

	return Component.build(Heading);
});
