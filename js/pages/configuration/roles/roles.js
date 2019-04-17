define([
    'knockout',
    'text!./roles.html',
    'pages/Page',
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
    Page,
    AutoBind,
    commonUtils,
    authApi,
    sharedState
) {
    class Roles extends AutoBind(Page) {
        constructor(params) {
            super(params);
            this.model = params.model;
            this.roles = ko.observable([]);
            this.loading = ko.observable();
    
            this.isAuthenticated = authApi.isAuthenticated;
            this.canRead = ko.pureComputed(() => { return this.isAuthenticated() && authApi.isPermittedReadRoles(); });
            this.canCreate = ko.pureComputed(() => { return this.isAuthenticated() && authApi.isPermittedCreateRole(); });
        }

        onPageCreated() {
            if (this.canRead()) {
                this.loading(true);
                this.model.updateRoles().then(() => {
                    this.loading(false);
                    this.roles(this.model.roles());
                });
            }            
        }
        
        selectRole(data) {
            commonUtils.routeTo('/role/' + data.id);
        }

        newRole() {
            commonUtils.routeTo('/role/0');
        }

        importRoles() {
            commonUtils.routeTo('/import/roles');
        }
    }

    return commonUtils.build('roles', Roles, view);
});
