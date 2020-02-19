define([
	'appConfig',
	'services/http'],
function(
	appConfig,
	httpService
) {

	const ISSUES_PAGE_SIZE = 100;

	function getBuildInfo() {

		return httpService.doGet(appConfig.webAPIRoot + 'info').then(r => r.data);
	}

	function getIssues(repo, milestone, page) {

		return httpService.doGet(`https://api.github.com/repos/${repo}/issues?state=closed&per_page=${ISSUES_PAGE_SIZE}&page=${page}&milestone=${milestone}`);
	}

	return {
		getBuildInfo,
		getIssues,
		ISSUES_PAGE_SIZE,
	}
});