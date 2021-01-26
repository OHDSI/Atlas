define([
	'knockout',
	'text!./role-group-mapping.html',
	'utils/AutoBind',
	'components/Component',
	'utils/CommonUtils',
	'./search-group-dialog',
], function(
	ko,
	view,
	AutoBind,
	Component,
	commonUtils,
){

	class RoleGroupMapping extends AutoBind(Component){

		constructor(params) {
			super(params);

			this.selectedRole = ko.observable();
			this.isSearchGroupDialog = ko.observable();
			this.rolesMapping = params.rolesMapping || ko.observableArray([]);
			this.provider = params.provider;
			this.searchResults = ko.observableArray();
			this.tableOptions = commonUtils.getTableOptions('L');
		}

		onRolesRowClick(data) {
			this.selectedRole(data);
			this.isSearchGroupDialog(true);
		}

		renderGroups(data, type, row) {
			return (row || []).groups().map(group => group.displayName).sort().join(", ");
		}

		setGroupMapping() {
			const selectedGroups = this.searchResults().filter(g => g.included()).map(g => {
				delete g.included;
				return g;
			});
			this.selectedRole().groups(selectedGroups);
			this.rolesMapping.valueHasMutated();
			this.closeGroupModal();
		}

		closeGroupModal() {
			this.isSearchGroupDialog(false);
		}
	}

	commonUtils.build('role-group-mapping', RoleGroupMapping, view);

});