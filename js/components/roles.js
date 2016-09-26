define(['knockout', 'text!./roles.html', 'appConfig', 'webapi/AuthAPI', 'knockout.dataTables.binding', 'databindings', 'forbidden', 'unauthenticated'], function (ko, view, config, authApi) {
    function roles(params) {
        var self = this;

        self.roles = params.model.roles;
        self.updateRoles = params.model.updateRoles;
        self.loading = ko.observable();
        self.selectRole = function(data) {
            document.location = '#/role/' + data.id;
        }

        self.newRole = function() {
            document.location = '#/role/0'
        }

        self.isAuthenticated = authApi.isAuthenticated();
        self.canRead = self.isAuthenticated && authApi.isPermittedReadRoles();
        self.canCreate = self.isAuthenticated && authApi.isPermittedCreateRole();

        if (self.canRead) {
            self.loading(true);
            self.updateRoles().done(function() {
                self.loading(false);
            });
        }
    }

    var component = {
        viewModel: roles,
        template: view
    };

    ko.components.register('roles', component);
    return component;
});
