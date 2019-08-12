define([
	'knockout',
	'text!./cohort-definitions.html',
	'appConfig',
	'services/AuthAPI',
	'pages/Page',
	'utils/CommonUtils',
	'pages/cohort-definitions/const',
	'databindings',
	'faceted-datatable',
	'components/heading',
], function (
	ko,
	view,
	config,
	authApi,
	Page,
	commonUtils,
	constants,
) {
	class CohortDefinitions extends Page {
		constructor(params) {
			super(params);
			this.model = params.model;
			this.cohortDefinitionId = ko.observable();
			this.cohortDefinitionId.extend({
				notify: 'always'
			});

			this.cohortDefinitionId.subscribe((id) => {
				commonUtils.routeTo(constants.paths.details(id));
			});


			this.newCohortButtonCaption = ko.computed(() => {
				if (this.model.currentCohortDefinition) {
					if (this.model.currentCohortDefinition() !== undefined) {
						return 'Please close your current cohort definition before creating a new one.';
					} else {
						return 'Create a new cohort definition.';
					}
				}
			});

			this.isAuthenticated 	= authApi.isAuthenticated;
			this.canReadCohorts 	= ko.pureComputed(() => (config.userAuthenticationEnabled && this.isAuthenticated() && authApi.isPermittedReadCohorts()) || !config.userAuthenticationEnabled);
			this.canCreateCohort 	= ko.pureComputed(() => (config.userAuthenticationEnabled && this.isAuthenticated() && authApi.isPermittedCreateCohort()) || !config.userAuthenticationEnabled);
		}

		newDefinition(data, event) {
			this.cohortDefinitionId('0');
		}

	}

	commonUtils.build('cohort-definitions', CohortDefinitions, view);
});
