define(['knockout', './Navigation', 'services/Annotation'], function (ko, Navigation, annotationService) {

    function Navigation(sampleName, cohortId, personId, sourceKey) {
      var self = this;
      self.prevSubjectId = ko.observable();
      self.nextSubjectId = ko.observable();
      self.nextUnannotatedSubjectId = ko.observable();
      self.numProfileSamples = ko.observable();
      self.numAnnotations = ko.observable();
      self.navigationLoaded = ko.observable(false);

      this.prevLink = function() {
        if (sampleName.indexOf(' ') >= 0) {
          sampleName= sampleName.split(" ").join('_');
        }
        window.location = `#/profiles/${sourceKey}/${self.prevSubjectId()}/${cohortId}/${sampleName}`
        location.reload()
      }
      this.nextLink = function() {
        if (sampleName.indexOf(' ') >= 0) {
          sampleName= sampleName.split(" ").join('_');
        }
        window.location = `#/profiles/${sourceKey}/${self.nextSubjectId()}/${cohortId}/${sampleName}`
        location.reload()
      }
  
      // this.prevLink = ko.computed(function() {
      //   if (sampleName.indexOf(' ') >=0) {
      //     sampleName  = sampleName.split(" ").join('_');
      //   }
      //     return `#/profiles/${sourceKey}/${self.prevSubjectId()}/${cohortId}/${sampleName}`;
      // }, self);
  
      // this.nextLink = ko.computed(function() {
      //   if (sampleName.indexOf(' ') >=0) {
      //     sampleName  = sampleName.split(" ").join('_');
      //   }
      //     return `#/profiles/${sourceKey}/${self.nextSubjectId()}/${cohortId}/${sampleName}`;
      // }, self);
  
      this.completionPercent = ko.computed(function() {
        return Math.ceil((self.numAnnotations()/self.numProfileSamples())*100);
      })
  
      self.initialize = function(sampleName, cohortId, personId, sourceKey) {
        annotationService.getAnnotationNavigation(sampleName, cohortId, personId, sourceKey)
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
  
      self.initialize(sampleName, cohortId, personId, sourceKey)
    }
  
    Navigation.prototype.constructor = Navigation;
  
      return Navigation;
  });