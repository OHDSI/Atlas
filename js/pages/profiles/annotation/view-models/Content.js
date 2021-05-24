define(['knockout', './Annotation', 'services/Annotation'], function (ko, Annotation, annotationService) {

    function Content(set, cohortId, personId, sourceKey, annotationView, sampleName) {
        var self = this;
        self.annotation = null;
        self.annotationLoaded = ko.observable(false);
        self.initialize = function (set, cohortId, personId, sourceKey) {
            annotationService.getAnnotationByCohortIdbySubjectIdBySetId(set.id, cohortId, personId, sourceKey)
                .then((annotation) => {
                    if (!annotation) {
                        self.annotation = new Annotation(set, personId, cohortId, sourceKey, [], null, annotationView, sampleName);
                    } else {
                        let {results, id} = annotation;
                        if (!results || results.length === 0) {
                            results = [];
                            console.log('AnnotationContent: empty results from annotationService.getAnnotationByCohortIdbySubjectIdBySetId');
                        }
                        self.annotation = new Annotation(set, personId, cohortId, sourceKey, results, id, annotationView, sampleName);
                    }
                    self.annotationLoaded(true);
                });
        };

        self.initialize(set, cohortId, personId, sourceKey)
    }

    Content.prototype.constructor = Content;

    return Content;
});