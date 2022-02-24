define(['knockout'], function (ko) {

    function SettingsView(annotationWidget) {
        const self = this;

        self.save = function () {
            annotationWidget.currentView("annotationView");
        };
    }

    SettingsView.prototype.constructor = SettingsView;

    return SettingsView;
});