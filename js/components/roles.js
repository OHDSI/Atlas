define(['knockout', 'text!./roles.html', 'appConfig', 'databindings', 'access-denied'], function (ko, view, config) {
    function roles(params) {
        var self = this;
        var authApi = params.model.authApi;
        self.roles = params.model.roles;
        self.updateRoles = params.model.updateRoles;
        self.loading = ko.observable();
        self.selectRole = function(data) {
            document.location = '#/role/' + data.id;
        }

        self.newRole = function() {
            document.location = '#/role/0'
        }

        self.isAuthenticated = authApi.isAuthenticated;
        self.canRead = ko.pureComputed(function() { return self.isAuthenticated() && authApi.isPermittedReadRoles(); });
        self.canCreate = ko.pureComputed(function() { return self.isAuthenticated() && authApi.isPermittedCreateRole(); });

        if (self.canRead()) {
            self.loading(true);
            self.updateRoles().always(function() { self.loading(false); });
        }
    }

    var component = {
        viewModel: roles,
        template: view
    };

    ko.components.register('roles', component);
    return component;
});
