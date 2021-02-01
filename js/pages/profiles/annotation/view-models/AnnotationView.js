define(['knockout', './Content', './Navigation', './SetSelect'], function (ko, Content, Navigation, SetSelect) {

    function AnnotationView(sets, cohortId, personId, sourceKey, sampleName, settingsView) {
      var self = this;
      self.content = ko.observable();
      self.navigation = ko.observable();
      self.initContent = function(set, cohortId, personId, sourceKey, sampleName) {
        self.content(new Content(set, cohortId, personId, sourceKey, self, sampleName));
      }
      self.initNavigation = function(sampleName, cohortId, personId, sourceKey) {
        self.navigation(new Navigation(sampleName, cohortId, personId, sourceKey));
      }
      self.setSelect = new SetSelect(sets, self, cohortId, personId, sourceKey, sampleName);
    }
  
    AnnotationView.prototype.constructor = AnnotationView;
  
      return AnnotationView;
  });