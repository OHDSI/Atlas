define([
	'knockout',
	'text!./user-bar-jobs.html',
	'components/Component',
	'utils/CommonUtils',
	'less!./user-bar-jobs.less',
], function(
	ko,
	view,
	Component,
	commonUtils,
) {
	class UserBarJobs extends Component {
		constructor(params) {
			super();

			this.jobNameClick = params.jobNameClick;
			this.jobListing = params.jobListing;
		}
	}

	return commonUtils.build('user-bar-jobs', UserBarJobs, view);
});