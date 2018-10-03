define(['knockout', './Annotation', 'services/Annotation'], function (ko, Annotation, annotationService) {

  function Content(set, cohortId, personId, sourceKey) {
    var self = this;
    self.annotation;
    self.annotationLoaded = ko.observable(false);

    self.initialize = function(set, cohortId, personId, sourceKey) {
      annotationService.getAnnotationByCohortIdbySubjectIdBySetId(set.id, cohortId, personId, sourceKey)
        .then((annotation) => {
          if (!annotation) {
            self.annotation = new Annotation(set, personId, cohortId, sourceKey, []);
          } else {
            let { results, id } = annotation;
            self.annotation = new Annotation(set, personId, cohortId, sourceKey, results, id);
          }
          self.annotationLoaded(true);
        });
    }

    self.initialize(set, cohortId, personId, sourceKey)
  }

  Content.prototype.constructor = Content;

	return Content;
});
