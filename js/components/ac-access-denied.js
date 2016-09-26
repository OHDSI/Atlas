define(['knockout', 'text!./access-denied.html', 'forbidden', 'unauthenticated'], function (ko, view) {
    function accessDenied(params) {
        var self = this;

        self.isAuthenticated = params.isAuthenticated;
    }

    var component = {
        viewModel: accessDenied,
        template: view
    };

    ko.components.register('access-denied', component);
    return component;
});
