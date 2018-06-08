define([
	'knockout',
	'text!./heading.html',
	'providers/Component',
	'utils/CommonUtils',
	'less!./heading.less'
], function (
	ko,
	view,
	Component,
	commonUtils
) {
	class Heading extends Component {
		constructor(params) {
			super(params);
			this.title = params.name;
			this.sourceKey = params.sourceKey;
		}
  }

	return commonUtils.build(Heading, 'heading-title', view);
});
