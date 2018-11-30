define([
	'knockout',
	'text!./heading.html',
	'components/Component',
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
			this.icon = params.icon || null;
			this.theme = params.theme || null;
			this.hasIcon = ko.computed(() => {
				return this.icon != null;
			});
		}
	}

	return commonUtils.build('heading-title', Heading, view);
});