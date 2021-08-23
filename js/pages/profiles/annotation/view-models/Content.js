define(['knockout', './Annotation', 'services/Annotation'], function (ko, Annotation, annotationService) {

    function Content(set, cohortId, personId, sourceKey, annotationView, sampleName, questionSetId) {
        const self = this;
        self.annotation = null;
        self.annotationLoaded = ko.observable(false);
        self.initialize = function (set, cohortId, personId, sourceKey) {
            let setId = questionSetId;
            if (!setId) {
                setId = set.id;
            }
            annotationService.getAnnotationBySampleIdbySubjectIdBySetId(setId, sampleName, personId, sourceKey)
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
                            self.annotation = new Annotation(set, personId, cohortId, sourceKey, results, id, annotationView, sampleName, setId);
                            self.annotationLoaded(true);
                        });
                } else {
                    self.annotation = new Annotation(set, personId, cohortId, sourceKey, [], null, annotationView, sampleName, setId);
                    self.annotationLoaded(true);
                }
            });
        };

        self.initialize(set, cohortId, personId, sourceKey);
    }

    Content.prototype.constructor = Content;

    return Content;
});