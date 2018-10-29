define([
    'knockout',
    'text!./roles.html',
    'components/Component',
    'utils/AutoBind',
    'utils/CommonUtils',
    'services/AuthAPI',
    'atlas-state',
    'databindings',
    'components/ac-access-denied',
    'components/heading'
], function (
    ko,
    view,
    Component,
    AutoBind,
    commonUtils,
    authApi,
    sharedState
) {
    class Roles extends AutoBind(Component) {
        constructor(params) {
            super(params);
            this.roles = sharedState.roles;
            this.updateRoles = params.model.updateRoles;
            this.loading = ko.observable();
    
            this.isAuthenticated = authApi.isAuthenticated;
            this.canRead = ko.pureComputed(() => { return this.isAuthenticated() && authApi.isPermittedReadRoles(); });
            this.canCreate = ko.pureComputed(() => { return this.isAuthenticated() && authApi.isPermittedCreateRole(); });
    
            if (this.canRead()) {
                this.loading(true);
                this.updateRoles().then(() => { this.loading(false); });
            }            
        }
        
        selectRole(data) {
            document.location = '#/role/' + data.id;
        }

        newRole() {
            document.location = '#/role/0'
        }
    }

    return commonUtils.build('roles', Roles, view);
});
