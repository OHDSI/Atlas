define([
	'./const',
], function(
	Const,
){

	const momentApi = require('services/MomentAPI');

	const ExecuteRender = (data) => {
		const result = Const.JobExecutionOptions.find(op => op.value === data);
		return result ? result.label : 'Unknown';
	};

	const EndsRender = (data, type, row) => {
		if (row.recurringUntilDate) {
			return 'On ' + momentApi.formatDateTimeUTC(row.recurringUntilDate);
		} else if (row.recurringTimes && row.recurringTimes > 0) {
			return `After ${row.recurringTimes} executions`;
		} else {
			return 'Never';
		}
	};

	const ProviderRender = (data, type, row) => {
		const res = Const.AuthenticationProviders.find(p => p.value === data);
		return (res && res.label) || "Unknown";
	};

	const JobStatusRender = (data, type, row) => {
		const exitMessage = row.exitMessage;
		const status = Const.JobStatusLabels[data] || "";
		return `<p title="${exitMessage}">${status}</p>`;
	};

	const ExitMessageRender = (data) => data ? `<a href="#" data-bind="click: () => $component.onMessageClick($data)">${data.substr(0, 20) + '...'}</a>` : '';

	return {
		ExecuteRender,
		EndsRender,
		ProviderRender,
		JobStatusRender,
		ExitMessageRender,
	};
});