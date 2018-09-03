define([
	'knockout',
	'text!./conceptsets-list.html',
	'providers/Component',
	'providers/AutoBind',
	'utils/CommonUtils',
	'webapi/AuthAPI',
  'components/tabs',
  'circe'
], function (
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	authApi,
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
			window.location.href = "#/conceptset/" + conceptSet.id + '/details';
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
				document.location = '#/conceptset/0/details';
			}
		}

	}

	return commonUtils.build('conceptsets-list', ConceptsetList, view);
});