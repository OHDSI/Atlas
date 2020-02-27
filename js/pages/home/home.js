define([
	'knockout',
	'text!./home.html',
	'pages/Page',
	'utils/CommonUtils',
	'services/http',
	'appConfig',
	'services/AuthAPI',
	'lodash',
	'components/heading',
], function (
	ko,
	view,
	Page,
	commonUtils,
	httpService,
	config,
	authApi,
	lodash
) {
	class Home extends Page {
		constructor(params) {
			super(params);
			this.github_status = ko.observableArray();

			this.canCreateCohort = ko.pureComputed(() => {
				return (authApi.isAuthenticated() && authApi.isPermittedCreateCohort()) || !config.userAuthenticationEnabled;
			});

			this.canSearch = ko.computed(() => {
				return authApi.isAuthenticated();
			});
		}

		async onPageCreated() {
			const atlasIssues = await this.getIssuesFromAllPages('OHDSI/Atlas', 31);
			const webapiIssues = await this.getIssuesFromAllPages('OHDSI/WebAPI', 33);
			let issues = lodash.orderBy([...atlasIssues, ...webapiIssues], ['closed_at'], ['desc']);
			// The API returns both issues and PRs and PRs in most cases would duplicate issues, therefore just leave issues
			issues = issues.filter(item => item.html_url.includes('/issues/'));
			this.github_status(issues);
		}

		async getIssuesFromAllPages(repo, milestone, page = 1, list = []) {

			const { data } = await httpService.doGet(`https://api.github.com/repos/${repo}/issues?state=closed&per_page=100&page=${page}&milestone=${milestone}`);
			if (data.length > 0) {
				return this.getIssuesFromAllPages(repo, milestone, page + 1, list.concat(data));
			} else {
				return list;
			}
		}

		newCohortDefinition() {
			document.location = "#/cohortdefinition/0";
		}

		browseVocabulary() {
			document.location = "#/search";
		}

	}

	return commonUtils.build('home', Home, view);
});
