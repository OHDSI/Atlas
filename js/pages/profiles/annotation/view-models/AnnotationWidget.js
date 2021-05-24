define(['knockout', './AnnotationView', './SettingsView', 'services/Annotation'], function (ko, AnnotationView, SettingsView, annotationService) {

    function AnnotationWidget(cohortId, personId, sourceKey, sampleName) {
        var self = this;
        var cachedOption = localStorage.getItem('annotationToggleState');
        if (cachedOption === undefined) {
            cachedOption = 'open';
        }
        self.currentView = ko.observable("annotationView");
        self.annotationToggleState = ko.observable(cachedOption);
        self.isVisible = ko.observable(false);

        self.toggleAnnotationPanel = function () {
            const nextAnnotationToggleState = this.annotationToggleState() === 'open' ? '' : 'open';
            this.annotationToggleState(nextAnnotationToggleState);
            localStorage.setItem('annotationToggleState', nextAnnotationToggleState);
        };

        self.initialize = function (cohortId, personId, sourceKey, sampleName, settingsView) {
            annotationService.getAnnotationSets(cohortId, sourceKey)//TODO include source key in this lookup as well
                .then((sets) => {
                    if (sets.length === 0 || !sets) {
                        self.isVisible(false);
                    } else {
                        self.annotationView = new AnnotationView(sets, cohortId, personId, sourceKey, sampleName,
                            settingsView);
                        self.isVisible(true);
                    }
                });
        };

        self.settingsView = new SettingsView(self);
        self.initialize(cohortId, personId, sourceKey, sampleName, self.settingsView);
    }

    AnnotationWidget.prototype.constructor = AnnotationWidget;
    return AnnotationWidget;
});