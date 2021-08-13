define(['knockout', './Annotation', 'services/Annotation'], function (ko, Annotation, annotationService) {

    function Content(set, cohortId, personId, sourceKey, annotationView, sampleName) {
        var self = this;
        self.annotation = null;
        self.annotationLoaded = ko.observable(false);
        self.initialize = function (set, cohortId, personId, sourceKey) {
            annotationService.getAnnotationBySampleIdbySubjectIdBySetId(set.id, sampleName, personId, sourceKey)
                .then((annotation) => {
                    if (!annotation) {
                        return {};
                    }
                    return annotation;
                }).then((annotation) => {
                    let {id} = annotation;
                    if (id) {
                        annotationService.getStudyResults(id)
                            .then((results) => {
                                self.annotation = new Annotation(set, personId, cohortId, sourceKey, results, id, annotationView, sampleName);
                                self.annotationLoaded(true);
                            });
                    } else {
                        self.annotation = new Annotation(set, personId, cohortId, sourceKey, [], null, annotationView, sampleName);
                        self.annotationLoaded(false);
                    }
                });
        };

        self.initialize(set, cohortId, personId, sourceKey);
    }

    Content.prototype.constructor = Content;

    return Content;
});