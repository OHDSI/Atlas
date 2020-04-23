define([
	'knockout',
	'text!./warnings-badge.html',
	'components/Component',
	'utils/CommonUtils',
], function (
	ko,
	view,
	Component,
	commonUtils,
) {
	class WarningBadgeComponent extends Component{
		constructor(params) {
			super(params);

			this.warningsTotal = params.warningsTotal || ko.observable();
	
			this.warningClass = ko.computed(() => {
				if (this.warningsTotal() > 0){
					if (this.warningsTotal() > 0) {
						return 'badge warning-alarm';
					} else if (this.warningsTotal() > 0) {
						return 'badge warning-warn';
					} else {
						return 'badge warning-info';
					}
				}
				return 'badge';
			});
		}
	}

	return commonUtils.build('warnings-badge', WarningBadgeComponent, view);
});