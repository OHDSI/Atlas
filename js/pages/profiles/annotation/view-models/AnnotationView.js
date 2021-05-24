define(['knockout', './Content', './Navigation', './SetSelect'], function (ko, Content, Navigation, SetSelect) {

    function AnnotationView(sets, cohortId, personId, sourceKey, sampleName, settingsView) {
        var self = this;
        self.content = ko.observable();
        self.navigation = ko.observable();

        self.loadedContent = ko.observable(false);
        self.loadedNavigation = ko.observable(false);
        self.loadedSelect = ko.observable(false);

        self.loaded = ko.computed(() => {
            return self.loadedContent();
        });

        self.initContent = function (set, cohortId, personId, sourceKey, sampleName) {
            self.content(new Content(set, cohortId, personId, sourceKey, self, sampleName));
            self.loadedContent(true);
        };
        self.initNavigation = function (sampleName, cohortId, personId, sourceKey) {
            self.navigation(new Navigation(sampleName, cohortId, personId, sourceKey));
            self.loadedNavigation(true);
        };
        self.setSelect = new SetSelect(sets, self, cohortId, personId, sourceKey, sampleName);
        self.loadedSelect(true);
    }

    AnnotationView.prototype.constructor = AnnotationView;

    return AnnotationView;
});