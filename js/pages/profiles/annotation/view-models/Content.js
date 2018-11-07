define(['knockout', './Annotation', 'services/Annotation'], function (ko, Annotation, annotationService) {

  function Content(set, cohortId, personId, sourceKey, annotationView) {
    var self = this;
    self.annotation;
    self.annotationLoaded = ko.observable(false);

    self.initialize = function(set, cohortId, personId, sourceKey) {
      annotationService.getAnnotationByCohortIdbySubjectIdBySetId(set.id, cohortId, personId, sourceKey)
        .then((annotation) => {
          if (!annotation) {
            self.annotation = new Annotation(set, personId, cohortId, sourceKey, [], null, annotationView);
          } else {
            let { results, id } = annotation;
            self.annotation = new Annotation(set, personId, cohortId, sourceKey, results, id, annotationView);
          }
          self.annotationLoaded(true);
        });
    }

    self.initialize(set, cohortId, personId, sourceKey)
  }

  Content.prototype.constructor = Content;

	return Content;
});
