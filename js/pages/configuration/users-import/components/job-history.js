define([
	'knockout',
	'text!./job-history.html',
	'utils/AutoBind',
	'components/Component',
	'utils/CommonUtils',
	'../services/JobService',
	'utils/DatatableUtils',
	'../utils',
	'less!./job-history.less',
], function(
	ko,
	view,
	AutoBind,
	Component,
	commonUtils,
	jobService,
	datatableUtils,
	utils,
){

	class JobHistory extends AutoBind(Component) {

		constructor(params) {
			super(params);
			this.jobId = params.jobId;
			this.job = params.job;
			this.jobHistory = ko.observableArray();
			this.loading = ko.observable();
			this.tableOptions = commonUtils.getTableOptions('L');
			this.datatableUtils = datatableUtils;
			this.loadHistory();
			this.jobId.subscribe(() => this.loadHistory());
			this.utils = utils;
			this.messageModal = ko.observable();
			this.exitMessageItems = ko.observable();
		}

		loadHistory() {
			this.loading(true);
			jobService.getJobHistory(this.job().id)
				.then(res => this.jobHistory(res))
				.finally(() => this.loading(false));
		}

		onMessageClick(data) {
			if (data && data.exitMessage) {
				this.exitMessageItems(data.exitMessage.split(',').map(l => l.trim()));
				this.messageModal(true);
			}
		}
	}

	commonUtils.build('user-import-job-history', JobHistory, view);

});