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

		        this.writeRoleName = ko.observable();
		        this.writeAccessList = ko.observable([]);		    
			this.writeRoleSuggestions = ko.observable([]);
			this.writeRoleOptions = ko.computed(() => this.writeRoleSuggestions().map(r => r.name));
			this.writeRoleSearch = ko.observable();
		        this.writeRoleSearch.subscribe(str => this.loadWriteRoleSuggestions(str));

		        this.readAccessList = ko.observable([]);
		        this.readRoleName = ko.observable();		    
		        this.readRoleSuggestions = ko.observable([]);
			this.readRoleOptions = ko.computed(() => this.readRoleSuggestions().map(r => r.name));
			this.readRoleSearch = ko.observable();
			this.readRoleSearch.subscribe(str => this.loadReadRoleSuggestions(str));

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

		async _loadReadAccessList() {
			let accessList = await this.loadAccessListFn('READ');
			accessList = accessList.map(a => ({ ...a, revoke: () => this.revokeRoleAccess(a.id) }));
			this.readAccessList(accessList);
		}

	        async _loadWriteAccessList() {
			let accessList = await this.loadAccessListFn('WRITE');
			accessList = accessList.map(a => ({ ...a, revoke: () => this.revokeRoleAccess(a.id) }));
			this.writeAccessList(accessList);
		}

		async loadReadRoleSuggestions() {
			const res = await this.loadRoleSuggestionsFn(this.readRoleSearch());
			this.readRoleSuggestions(res);
		}

	    	async loadWriteRoleSuggestions() {
			const res = await this.loadRoleSuggestionsFn(this.writeRoleSearch());
			this.writeRoleSuggestions(res);
		}

		async loadAccessList() {
			this.isLoading(true);
			try {
			        await this._loadReadAccessList();
			        await this._loadWriteAccessList();
			} catch (ex) {
				console.log(ex);
			}
			this.isLoading(false);
		}

		async grantAccess(perm_type) {
			this.isLoading(true);
			try {
			       if (perm_type == 'WRITE'){
				   const role = this.writeRoleSuggestions().find(r => r.name === this.writeRoleName());
			           await this.grantAccessFn(role.id,'WRITE');
				   await this._loadWriteAccessList();
				   this.writeRoleName('');
  			       } else {
				   const role = this.readRoleSuggestions().find(r => r.name === this.readRoleName());
			   	   await this.grantAccessFn(role.id,'READ');
				   await this._loadReadAccessList();
				   this.readRoleName('');
			       }
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
