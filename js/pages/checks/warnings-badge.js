define([
	'knockout',
	'text!./warnings-badge.html',
], function (
	ko,
	view,
) {
	function warningBadgeComponent(params){
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

	var component = {
		viewModel: warningBadgeComponent,
		template: view,
	};

	ko.components.register('warnings-badge', component);
	return component;
});