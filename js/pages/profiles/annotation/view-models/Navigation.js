define(['knockout', './Navigation', 'services/Annotation'], function (ko, Navigation, annotationService) {

  function Navigation(setId, cohortId, personId, sourceKey) {
    var self = this;
    self.prevSubjectId = ko.observable();
    self.nextSubjectId = ko.observable();
    self.nextUnannotatedSubjectId = ko.observable();
    self.numProfileSamples = ko.observable();
    self.numAnnotations = ko.observable();
    self.navigationLoaded = ko.observable(false);

    this.prevLink = ko.computed(function() {
        return `/#/profiles/${sourceKey}/${self.prevSubjectId()}/${cohortId}`;
    }, self);

    this.nextLink = ko.computed(function() {
        return `/#/profiles/${sourceKey}/${self.nextSubjectId()}/${cohortId}`;
    }, self);

    this.completionPercent = ko.computed(function() {
      return Math.ceil((self.numAnnotations()/self.numProfileSamples())*100);
    })

    self.initialize = function(setId, cohortId, personId, sourceKey) {
      annotationService.getAnnotationNavigation(cohortId, personId, sourceKey, setId)
        .then((navigation) => {
          const { prevSubjectId, nextSubjectId, nextUnannotatedSubjectId, numProfileSamples, numAnnotations } = navigation;
          self.prevSubjectId(prevSubjectId);
          self.nextSubjectId(nextSubjectId);
          self.nextUnannotatedSubjectId(nextUnannotatedSubjectId);
          self.numProfileSamples(numProfileSamples);
          self.numAnnotations(numAnnotations);
          self.navigationLoaded(true);
        })
    }

    self.initialize(setId, cohortId, personId, sourceKey)
  }

  Navigation.prototype.constructor = Navigation;

	return Navigation;
});
