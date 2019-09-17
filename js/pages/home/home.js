define([
	'knockout',
	'text!./home.html',
	'pages/Page',
	'utils/CommonUtils',
	'services/http',
	'appConfig',
	'services/AuthAPI',
	'atlas-state',
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
	sharedState,
	lodash
) {
	class Home extends Page {
		constructor(params) {
			super(params);
			this.github_status = ko.observableArray();

			this.canCreateCohort = ko.pureComputed(() => {
				return (authApi.isAuthenticated() && authApi.isPermittedCreateCohort()) || !config.userAuthenticationEnabled;
			});
			this.currentCohortDefinition = sharedState.CohortDefinition.current;
			this.canSearch = ko.computed(() => {
				return authApi.isAuthenticated();
			});
		}

		async onPageCreated() {
			const [{ data: atlasIssues }, { data: webapiIssues }] = await Promise.all([
				httpService.doGet("https://api.github.com/repos/OHDSI/Atlas/issues?state=closed&milestone=22"),
				httpService.doGet("https://api.github.com/repos/OHDSI/WebAPI/issues?state=closed&milestone=25")
			]);
			let data = lodash.orderBy([...atlasIssues, ...webapiIssues], ['closed_at'], ['desc']);
			// The API returns both issues and PRs and PRs in most cases would duplicate issues, therefore just leave issues
			data = data.filter(item => item.html_url.includes('/issues/'));
			this.github_status(data);
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
