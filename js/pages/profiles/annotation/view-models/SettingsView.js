define(['knockout'], function (ko) {

  function SettingsView(annotationWidget) {
    var self = this;

    self.save = function() {
      annotationWidget.currentView("annotationView");
    }
  }

  SettingsView.prototype.constructor = SettingsView;

	return SettingsView;
});
