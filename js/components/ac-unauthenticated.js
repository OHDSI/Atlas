define(['knockout', 'text!./unauthenticated.html', 'appConfig', 'services/AuthAPI'], function (ko, view, appConfig, authApi) {
    function unauthenticated(params) {
        var self = this;
        self.signInOpened = authApi.signInOpened;
    }

    var component = {
        viewModel: unauthenticated,
        template: view
    };

    ko.components.register('unauthenticated', component);
    return component;
});
