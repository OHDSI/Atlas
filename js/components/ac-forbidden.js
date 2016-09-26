define(['knockout', 'text!./forbidden.html', 'appConfig'], function (ko, view, appConfig) {
    function forbidden(params) {
        var self = this;
    }

    var component = {
        viewModel: forbidden,
        template: view
    };

    ko.components.register('forbidden', component);
    return component;
});
