define([
	'knockout',
	'text!./search-group-dialog.html',
	'utils/AutoBind',
	'components/Component',
	'utils/CommonUtils',
	'components/modal',
	'./ldap-groups',
], function(
	ko,
	view,
	AutoBind,
	Component,
	commonUtils,
){

	class SearchGroupDialog extends AutoBind(Component) {
		constructor(params){
			super(params);
			this.open = params.open || ko.observable();
			this.importProvider = params.importProvider;
			this.selectedRole = params.selectedRole;
			this.searchResults = params.searchResults;
		}

		closeModal() {
			this.open(false);
		}

		setGroupMapping() {
			const selectedGroups = this.searchResults().filter(g => g.included()).map(g => {
				delete g.included;
				return g;
			});
			this.selectedRole().groups(selectedGroups);
			this.closeModal();
		}
	}


	commonUtils.build('search-group-dialog', SearchGroupDialog, view);
});