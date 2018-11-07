define(['knockout', './Content', './Navigation', './SetSelect'], function (ko, Content, Navigation, SetSelect) {

  function AnnotationView(sets, cohortId, personId, sourceKey, settingsView) {
    var self = this;
    self.content = ko.observable();
    self.navigation = ko.observable();
    self.initContent = function(set, cohortId, personId, sourceKey) {
      self.content(new Content(set, cohortId, personId, sourceKey, self));
    }
    self.initNavigation = function(set, cohortId, personId, sourceKey) {
      self.navigation(new Navigation(set, cohortId, personId, sourceKey));
    }
    self.setSelect = new SetSelect(sets, self, cohortId, personId, sourceKey);
  }

  AnnotationView.prototype.constructor = AnnotationView;

	return AnnotationView;
});
