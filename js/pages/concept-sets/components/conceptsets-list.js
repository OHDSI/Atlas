define([
	'knockout',
	'text!./conceptsets-list.html',
	'providers/Component',
	'providers/AutoBind',
	'utils/CommonUtils',
	'services/permissions/ConceptSetPermissionService',
	'../const',
  'components/tabs',
  'circe'
], function (
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	ConceptSetPermissionService,
	constants,
) {
	class ConceptsetList extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.model = params.model;
	
			this.canCreateConceptSet = ko.pureComputed(function () {
				return ConceptSetPermissionService.isPermittedCreateConceptset();
			});
		}		

		onRespositoryConceptSetSelected (conceptSet) {
			window.location.href = constants.paths.mode(conceptSet.id);
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
				document.location = constants.paths.mode();
			}
		}

	}

	return commonUtils.build('conceptsets-list', ConceptsetList, view);
});