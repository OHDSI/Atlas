define([
	'knockout',
	'text!./home.html',
	'providers/Page',
	'utils/CommonUtils',
	'services/httpService',
	'appConfig',
	'services/AuthService',
	'services/permissions/CohortPermissionService',
	'components/heading',
], function (
	ko,
	view,
	Page,
	commonUtils,
	httpService,
	config,
	AuthService,
	CohortPermissionService,
) {
	class Home extends Page {
		constructor(params) {
			super(params);
			this.github_status = ko.observableArray();
			
			this.canCreateCohort = ko.pureComputed(() => {
				return (AuthService.isAuthenticated() && CohortPermissionService.isPermittedCreateCohort()) || !config.userAuthenticationEnabled;
			});

			this.canSearch = ko.computed(() => {
				return AuthService.isAuthenticated();
			});
		}

		async onPageCreated() {
			const { data } = await httpService.doGet("https://api.github.com/repos/OHDSI/Atlas/issues?state=closed&milestone=18");
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
