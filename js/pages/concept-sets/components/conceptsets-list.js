define([
	'knockout',
	'text!./conceptsets-list.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'services/AuthAPI',
	'services/ConceptSet',
	'atlas-state',
	'../const',
  'appConfig',
  'const',
  'components/tabs',
  'circe'
], function (
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	authApi,
	conceptSetService,
	sharedState,
	constants,
	config,
	globalConstants,
) {
	class ConceptsetList extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.currentConceptSet = sharedState.repositoryConceptSet.current;
			this.currentConceptSetSource = sharedState.ConceptSet.source;
			this.currentCohortDefinition = sharedState.CohortDefinition.current;
			this.currentCohortDefinitionSourceInfo = sharedState.CohortDefinition.sourceInfo;
			this.currentCohortDefinitionDirtyFlag = sharedState.CohortDefinition.dirtyFlag;
			this.criteriaContext = sharedState.criteriaContext;
			this.canCreateConceptSet = ko.pureComputed(function () {
				return ((authApi.isAuthenticated() && authApi.isPermittedCreateConceptset()) || !config.userAuthenticationEnabled);
			});
		}

		action(callback) {
			callback();
		}

		clearCohortDefinition() {
			conceptSetService.clearConceptSet({ source: globalConstants.conceptSetSources.repository });
			this.currentCohortDefinitionSourceInfo(null);
			this.currentCohortDefinition(null);
		}

		onRespositoryConceptSetSelected (conceptSet) {
			this.action(() => commonUtils.routeTo(constants.paths.mode(conceptSet.id)));
		}

		onConceptSetBrowserAction (result) {
			// Inspect the result to see what type of action was taken. For now
			// we're handling the 'add' action
			if (result.action == 'add') {
				this.action(this.newConceptSet);
			}
		}

		newConceptSet() {
			if (this.currentConceptSet() == undefined) {
				this.currentConceptSetSource('repository');
				commonUtils.routeTo(constants.paths.mode());
			}
		}

	}

	return commonUtils.build('conceptsets-list', ConceptsetList, view);
});