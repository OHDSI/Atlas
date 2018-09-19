define([
    'knockout',
    'pages/characterizations/services/CharacterizationService',
    'pages/characterizations/services/PermissionService',
    'text!./characterization-utils.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'utils/CommonUtils',
    'less!./characterization-utils.less',
], function (
    ko,
    CharacterizationService,
    PermissionService,
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

            this.characterizationId = params.characterizationId;
            this.mode = ko.observable(this.MODE_JSON);

            this.isExportPermitted = this.isExportPermittedResolver();
            this.isImportPermitted = this.isImportPermittedResolver();

            this.setMode = this.setMode.bind(this);

            this.exportEntity = ko.observable();
            this.exportJSON = ko.computed(() => JSON.stringify(this.exportEntity(), null, 2));

            this.importJSON = ko.observable();

            this.isExportPermitted() && this.loadExportJSON();
        }

        isExportPermittedResolver() {
            return ko.computed(() => PermissionService.isPermittedExportCC(this.characterizationId()));
        }

        isImportPermittedResolver() {
            return PermissionService.isPermittedImportCC;
        }

        setMode(mode) {
            this.mode(mode);
        }

        loadExportJSON() {
            this.loading(true);

            CharacterizationService
                .loadCharacterizationDesign(this.characterizationId())
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
