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
            window.location = `#/profiles/${sourceKey}/${self.prevSubjectId()}/${cohortId}/${sampleName}`;
            location.reload();
        };
        this.nextLink = function() {
            if (sampleName.indexOf(' ') >= 0) {
                sampleName= sampleName.split(" ").join('_');
            }
            window.location = `#/profiles/${sourceKey}/${self.nextSubjectId()}/${cohortId}/${sampleName}`;
            location.reload();
        };

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
        });

        self.initialize = function(sampleName, cohortId, personId, sourceKey) {
            annotationService.getAnnotationNavigation(sampleName, cohortId, personId, sourceKey)
                .then((navigation) => {
                    // const { prevSubjectId, nextSubjectId, nextUnannotatedSubjectId, numProfileSamples, numAnnotations } = navigation;
                    const samples = navigation.elements;

                    let val = -1;
                    for (let i = 0; i < samples.length; i++) {
                        let item = samples[i];
                        if (item.personId === personId) {
                            val = i;
                            break;
                        }
                    }
                    if (val !== -1) {
                        let lastSubjectId = null;
                        let nextSubjectId = null;
                        if ((val - 1) < 0) {
                            lastSubjectId = samples[samples.length - 1].personId;
                        } else {
                            lastSubjectId = samples[val - 1].personId;
                        }
                        if ((val + 1) > (samples.length - 1)) {
                            nextSubjectId = samples[0].personId;

                        } else {
                            nextSubjectId = samples[val + 1].personId;
                        }

                        self.prevSubjectId(lastSubjectId);
                        self.nextSubjectId(nextSubjectId);

                        self.numProfileSamples(samples.length);
                        self.navigationLoaded(true);

                        self.numAnnotations(0);
                        self.nextUnannotatedSubjectId(nextSubjectId);

                    }
                });
        };

        self.initialize(sampleName, cohortId, personId, sourceKey)
    }

    Navigation.prototype.constructor = Navigation;

    return Navigation;
});