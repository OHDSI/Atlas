define(['knockout', './AnnotationView', './SettingsView', 'services/Annotation'], function (ko, AnnotationView, SettingsView, annotationService) {

  function AnnotationWidget(cohortId, personId, sourceKey) {
    var self = this;
    self.isVisable = ko.observable(false);
    self.currentView = ko.observable("annotationView");
    self.annotationToggleState = ko.observable(localStorage.getItem('annotationToggleState'));

    self.toggleAnnotationPanel = function() {
      const nextAnnotationToggleState = this.annotationToggleState() == 'open' ? '' : 'open'
      this.annotationToggleState(nextAnnotationToggleState);
      localStorage.setItem('annotationToggleState', nextAnnotationToggleState);
    }

    self.initialize = function(cohortId, personId, sourceKey, settingsView) {
      annotationService.getAnnotationSets(cohortId, sourceKey)//TODO include source key in this lookup as well
        .then((sets) => {
          if (sets.length == 0 || !sets) {
            return self.isVisable(false);
          }
          self.annotationView = new AnnotationView(sets, cohortId, personId, sourceKey, settingsView);
          self.isVisable(true);
        })
    }

    self.settingsView = new SettingsView(self);
    self.initialize(cohortId, personId, sourceKey, self.settingsView);
  }

  AnnotationWidget.prototype.constructor = AnnotationWidget;

	return AnnotationWidget;
});
