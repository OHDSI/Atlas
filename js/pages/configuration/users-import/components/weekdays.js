define([
	'knockout',
	'text!./weekdays.html',
	'utils/AutoBind',
	'components/Component',
	'utils/CommonUtils',
	'./const',
	'less!./weekdays.less',
], function (
	ko,
	view,
	AutoBind,
	Component,
	commonUtils,
	Consts,
) {

	class Weekdays extends AutoBind(Component) {
		constructor(params) {
			super(params);

			this.labelFormat = params.labelFormat || 'short';
			this.weekdays = Consts.WEEKDAYS.map(d => ({...d, label: d[this.labelFormat]}));
			this.selectedWeekdays = params.weekdays || ko.observableArray([]);
		}

		onDayClick(day) {
			if (this.selectedWeekdays().find(d => d === day)) {
				this.selectedWeekdays.remove(day);
			} else {
				this.selectedWeekdays.push(day);
			}
		}

		dayModifier(day) {
			return this.selectedWeekdays().find(d => d === day) ? 'selected' : null;
		}

		buttonClass(day) {
			return ko.computed(() => {
				const params = {
					element: 'button',
					extra: 'btn',
				};
				const mod = this.dayModifier(day);
				if (mod) {
					params.modifiers = mod;
				}
				return this.classes(params);
			});
		}
	}

	commonUtils.build('weekdays', Weekdays, view);
});