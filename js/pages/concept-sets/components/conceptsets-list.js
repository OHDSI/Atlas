define([
	'knockout',
	'text!./conceptsets-list.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'services/AuthAPI',
	'../const',
  'components/tabs',
  'circe'
], function (
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	authApi,
	constants,
) {
	class ConceptsetList extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.model = params.model;

			this.canCreateConceptSet = ko.pureComputed(function () {
				return authApi.isPermittedCreateConceptset();
			});
		}

		onRespositoryConceptSetSelected (conceptSet) {
			commonUtils.routeTo(constants.paths.mode(conceptSet.id));
		}

		onConceptSetBrowserAction (result) {
			// Inspect the result to see what type of action was taken. For now
			// we're handling the 'add' action
			if (result.action == 'add') {
				this.newConceptSet();
			}
		}

		newConceptSet() {
			if (this.model.currentConceptSet() == undefined) {
				this.model.currentConceptSetSource('repository');
				commonUtils.routeTo(constants.paths.mode());
			}
		}

	}

	return commonUtils.build('conceptsets-list', ConceptsetList, view);
});