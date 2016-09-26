define(['knockout', 'text!./unauthenticated.html', 'appConfig'], function (ko, view, appConfig) {
    function unauthenticated(params) {
        var self = this;
    }

    var component = {
        viewModel: unauthenticated,
        template: view
    };

    ko.components.register('unauthenticated', component);
    return component;
});
