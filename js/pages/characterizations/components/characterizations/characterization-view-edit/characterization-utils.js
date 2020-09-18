define([
    'knockout',
    'pages/characterizations/services/CharacterizationService',
    'pages/characterizations/services/PermissionService',
    'text!./characterization-utils.html',
    'appConfig',
    'services/AuthAPI',
    'components/Component',
    'utils/AutoBind',
    'utils/CommonUtils',
    'utilities/import',
    'utilities/export',
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
            this.dirtyFlag = params.designDirtyFlag;
            this.characterizationId = params.characterizationId;
            this.mode = ko.observable(this.MODE_JSON);

            this.isPermittedExport = PermissionService.isPermittedExportCC;
            this.isPermittedImport = PermissionService.isPermittedImportCC;
            this.exportService = CharacterizationService.loadCharacterizationExportDesign;
            this.importService = CharacterizationService.importCharacterization;
            this.afterImportSuccess = params.afterImportSuccess;

            this.setMode = this.setMode.bind(this);
        }

        setMode(mode) {
            this.mode(mode);
        }
    }

    return commonUtils.build('characterization-view-edit-utils', CharacterizationViewEditUtils, view);
});
