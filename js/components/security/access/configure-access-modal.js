define([
	'knockout',
	'text!./configure-access-modal.html',
	'components/Component',
	'utils/CommonUtils',
	'utils/AutoBind',
	'less!./configure-access-modal.less',
	'databindings',
], function (
	ko,
	view,
	Component,
	commonUtils,
	AutoBind
) {
	class ConfigureAccessModal extends AutoBind(Component) {
		constructor(params) {
			super(params);

			this.isModalShown = params.isModalShown;
			this.isLoading = ko.observable(false);
			this.accessList = ko.observable([]);
			this.roleName = ko.observable();

			this.roleSuggestions = ko.observable([]);
			this.roleOptions = ko.computed(() => this.roleSuggestions().map(r => r.name));
			this.roleSearch = ko.observable();
			this.roleSearch.subscribe(str => this.loadRoleSuggestions(str));

			this.isOwnerFn = params.isOwnerFn;
			this.grantAccessFn = params.grantAccessFn;
			this.loadAccessListFn = params.loadAccessListFn;
			this.revokeAccessFn = params.revokeAccessFn;
			this.loadRoleSuggestionsFn = params.loadRoleSuggestionsFn;

			this.columns = [
				{
					class: this.classes('access-tbl-col-id'),
					title: ko.i18n('columns.id', 'ID'),
					data: 'id'
				},
				{
					class: this.classes('access-tbl-col-name'),
					title: ko.i18n('columns.name', 'Name'),
					data: 'name'
				},
				{
					class: this.classes('access-tbl-col-action'),
					title: ko.i18n('columns.action', 'Action'),
					render: (s, p, d) => !this.isOwnerFn(d.name) ? `<a data-bind="css: '${this.classes('revoke-link')}', click: revoke, text: ko.i18n('common.configureAccessModal.revoke', 'Revoke')"></a>` : '-'
				}
			];

			this.isModalShown.subscribe(open => !!open && this.loadAccessList());
		}

		async _loadAccessList() {
			let accessList = await this.loadAccessListFn();
			accessList = accessList.map(a => ({ ...a, revoke: () => this.revokeRoleAccess(a.id) }));
			this.accessList(accessList);
		}

		async loadRoleSuggestions() {
			const res = await this.loadRoleSuggestionsFn(this.roleSearch());
			this.roleSuggestions(res);
		}

		async loadAccessList() {
			this.isLoading(false);
			try {
				await this._loadAccessList();
			} catch (ex) {
				console.log(ex);
			}
			this.isLoading(false);
		}

		async grantAccess() {
			this.isLoading(true);
			try {
				const role = this.roleSuggestions().find(r => r.name === this.roleName());
				await this.grantAccessFn(role.id);
				await this._loadAccessList();
				this.roleName('');
			} catch (ex) {
				console.log(ex);
			}
			this.isLoading(false);
		}

		async revokeRoleAccess(roleId) {
			this.isLoading(true);
			try {
				await this.revokeAccessFn(roleId);
				await this._loadAccessList();
			} catch (ex) {
				console.log(ex);
			}
			this.isLoading(false);
		}
	}

	return commonUtils.build('configure-access-modal', ConfigureAccessModal, view);
});
