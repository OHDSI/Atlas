define([
	'knockout',
	'text!./job-scheduler.html',
	'utils/AutoBind',
	'components/Component',
	'utils/CommonUtils',
	'../const',
	'./weekdays',
	'less!./job-scheduler.less',
], function (
	ko,
	view,
	AutoBind,
	Component,
	commonUtils,
	Const,
) {

	function toDate(date) {
		return date ? moment.utc(date).toDate() : null;
	}

	class JobScheduler extends AutoBind(Component) {
		constructor(params) {

			super(params);
			this.job = params.job || ko.observable({});
			this.weekdays = params.weekdays || ko.observableArray();
			this.jobEnds = params.jobEnds || ko.observable(Const.JobEndOptions.NEVER);
			this.jobEndOptions = Const.JobEndOptions;
			this.executionOptions = Const.JobExecutionOptions;
			this.weeklyVisible = ko.computed(() => this.job().frequency && this.job().frequency() === Const.JobExecution.WEEKLY);
			this.notOnceVisible = ko.computed(() => this.job().frequency && this.job().frequency() !== Const.JobExecution.ONCE);
		}
	}

	commonUtils.build('job-scheduler', JobScheduler, view);

});