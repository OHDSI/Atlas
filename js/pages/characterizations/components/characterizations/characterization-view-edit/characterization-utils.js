define([
    'knockout',
    'pages/characterizations/services/CharacterizationService',
    'text!./characterization-utils.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'utils/CommonUtils',
    'less!./characterization-utils.less',
], function (
    ko,
    CharacterizationService,
    view,
    config,
    authApi,
    Component,
    commonUtils,
) {
    class CharacterizationViewEditUtils extends Component {
        constructor(params) {
            super();

            this.doImport = this.doImport.bind(this);

            this.loading = ko.observable(false);

            this.MODE_JSON = 0;
            this.MODE_IMPORT = 1;

            this.mode = ko.observable(this.MODE_JSON);

            this.setMode = this.setMode.bind(this);

            this.exportEntity = ko.observable();
            this.exportJSON = ko.computed(() => JSON.stringify(this.exportEntity(), null, 2));

            this.importJSON = ko.observable();

            this.loadExportJSON();
        }

        setMode(mode) {
            this.mode(mode);
        }

        loadExportJSON() {
            this.loading(true);

            CharacterizationService
                .loadCharacterizationExportJson()
                .then(res => {
                    this.exportEntity(res);
                    this.loading(false);
                });
        }

        doImport() {
            console.log('Importing:', this.importJSON());
        }
    }

    return commonUtils.build('characterization-view-edit-utils', CharacterizationViewEditUtils, view);
});
