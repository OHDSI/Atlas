define([
    'knockout',
    'pages/characterizations/services/CharacterizationService',
    'pages/characterizations/services/PermissionService',
    'text!./characterization-utils.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'providers/AutoBind',
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
    AutoBind,
    commonUtils,
) {
    class CharacterizationViewEditUtils extends AutoBind(Component) {
        constructor(params) {
            super();

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
                .loadCharacterizationExportDesign(this.characterizationId())
                .then(res => {
                    this.exportEntity(res);
                    this.loading(false);
                });
        }

        doImport() {
            this.loading(true);

            CharacterizationService
                .importCharacterization(JSON.parse(this.importJSON()))
                .then(res => {
                    this.loading(false);
                    commonUtils.routeTo('/cc/characterizations/' + res.id);
                });
        }
    }

    return commonUtils.build('characterization-view-edit-utils', CharacterizationViewEditUtils, view);
});
