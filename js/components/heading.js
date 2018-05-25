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
		constructor() {
			super();
			this.name = 'heading-title';
			this.view = view;
		}

		render(params) {
			super.render(params);
			this.name = params.name;
			this.sourceKey = params.sourceKey;
			return this;
		}
  }

	const heading = new Heading();
	return heading.build();
});
