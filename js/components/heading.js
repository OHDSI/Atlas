define([
	'knockout',
	'text!./heading.html',
	'providers/Component',
	'const',
	'less!./heading.less'
], function (
	ko,
	view,
	Component,
	helpers
) {
	class Heading extends Component {
		constructor(params) {
			super(params);
			this.title = params.name;
			this.sourceKey = params.sourceKey;
		}
  }

	return helpers.build(Heading, 'heading-title', view);
});
