define([
	'knockout',
	'text!./home.html',
	'pages/Page',
	'utils/CommonUtils',
	'services/http',
	'appConfig',
	'services/AuthAPI',
	'components/heading',
], function (
	ko,
	view,
	Page,
	commonUtils,
	httpService,
	config,
	authApi
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
			const { data } = await httpService.doGet("https://api.github.com/repos/OHDSI/Atlas/issues?state=closed&milestone=26");
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
