define([
	'knockout',
	'text!./warnings-badge.html',
	'components/Component',
	'utils/CommonUtils',
	'less!./warnings-badge.less',
], function (
	ko,
	view,
	Component,
	commonUtils,
) {
	class WarningsBadgeComponent extends Component {
		constructor(params) {
			super(params);
			this.warningsTotal = params.warningsTotal || ko.observable();
			this.warningCount = params.warningCount || ko.observable();
			this.criticalCount = params.criticalCount || ko.observable();
			this.isDiagnosticsRunning = params.isDiagnosticsRunning || ko.observable(false);

			this.warningClass = ko.pureComputed(() => {
				if (this.warningsTotal() > 0) {
					if (this.criticalCount() > 0) {
						return 'badge warning-alarm';
					} else if (this.warningCount() > 0) {
						return 'badge warning-warn';
					} else {
						return 'badge warning-info';
					}
				}
				return 'badge';
			});
		}
	}

	return commonUtils.build('warnings-badge', WarningsBadgeComponent, view);
});