define([
	'knockout',
	'text!./home.html',
	'pages/Page',
	'utils/CommonUtils',
	'appConfig',
	'./const',
	'services/AuthAPI',
	'services/BuildInfoService',
	'atlas-state',
	'lodash',
	'version',
	'components/heading',
], function (
	ko,
	view,
	Page,
	commonUtils,
	config,
	consts,
	authApi,
	buildInfoService,
	sharedState,
	lodash,
	version,
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
			this.atlasVersion = ko.observable(this.formatVersion(version));
			this.webapiVersion = ko.observable();
			this.atlasReleaseTag = ko.observable();
			this.webapiReleaseTag = ko.observable();
			this.loading = ko.observable();
			this.atlasReleaseUrl = ko.computed(() => consts.releaseNotesUrl('Atlas', this.atlasReleaseTag()));
			this.webapiReleaseUrl = ko.computed(() => consts.releaseNotesUrl('WebAPI', this.webapiReleaseTag()));
		}

		async onPageCreated() {
			const info = await buildInfoService.getBuildInfo();
			const atlasMilestoneId = lodash.get(info, 'buildInfo.atlasRepositoryInfo.milestoneId', '*');
			const webapiMilestoneId = lodash.get(info, 'buildInfo.webapiRepositoryInfo.milestoneId', '*');
			const atlasReleaseTag = lodash.get(info, 'buildInfo.atlasRepositoryInfo.releaseTag');
			const webapiReleaseTag = lodash.get(info, 'buildInfo.webapiRepositoryInfo.releaseTag');
			this.atlasReleaseTag(atlasReleaseTag);
			this.webapiReleaseTag(webapiReleaseTag);
			this.webapiVersion(this.getWebapiVersion(info));
			const atlasIssues = await this.getIssuesFromAllPages('OHDSI/Atlas', atlasMilestoneId);
			const webapiIssues = await this.getIssuesFromAllPages('OHDSI/WebAPI', webapiMilestoneId);
			let issues = lodash.orderBy([...atlasIssues, ...webapiIssues], ['closed_at'], ['desc']);
			// The API returns both issues and PRs and PRs in most cases would duplicate issues, therefore just leave issues
			issues = issues.filter(item => item.html_url.includes('/issues/'));
			this.github_status(issues);
		}

		async getIssuesFromAllPages(repo, milestone, page = 1, list = []) {

			this.loading(true);
			try {
				const {data} = await buildInfoService.getIssues(repo, milestone, page);
				if (data.length === buildInfoService.ISSUES_PAGE_SIZE) {
					return this.getIssuesFromAllPages(repo, milestone, page + 1, list.concat(data));
				} else {
					return list.concat(data);
				}
			} finally {
				this.loading(false);
			}
		}

		formatVersion(ver) {
			return ver.replace(/(\d+\.\d+\.\d+)-(.*)/, "$1 $2");
		}

		getWebapiVersion(info) {
			let qualifier = false;
			const artifactVersion = (info.buildInfo && info.buildInfo.artifactVersion) || '';
			if (artifactVersion.match(/.*-SNAPSHOT/)) {
				qualifier = ' DEV';
			} else if (artifactVersion.match(/.*-(RC\d*)/)) {
				qualifier = ' ' + artifactVersion.match(/.*-(RC\d*)/)[1];
			}
			return info.version + (qualifier || '');
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
