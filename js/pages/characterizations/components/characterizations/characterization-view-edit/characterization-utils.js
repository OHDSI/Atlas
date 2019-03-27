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
    '../../../const',
    'utilities/import', 
    'utilities/export',
    'utilities/download',
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
    constants,
) {
    class CharacterizationViewEditUtils extends AutoBind(Component) {
        constructor(params) {
            super();

            this.loading = ko.observable(false);

            this.MODE_JSON = 0;
            this.MODE_IMPORT = 1;
            this.MODE_DOWNLOAD = 2;

            this.characterizationId = params.characterizationId;
            this.mode = ko.observable(this.MODE_JSON);

            this.isPermittedExport = PermissionService.isPermittedExportCC;
            this.isPermittedImport = PermissionService.isPermittedImportCC;
            this.isPermittedDownload = ko.computed(() => PermissionService.isPermittedDownloadCC(this.characterizationId()));
            this.exportService = CharacterizationService.loadCharacterizationExportDesign;
            this.importService = CharacterizationService.importCharacterization;

            this.setMode = this.setMode.bind(this);
        }

        setMode(mode) {
            this.mode(mode);
        }

        downloadUrl() {
            return (packageName) => constants.apiPaths.downloadPackage(this.characterizationId(), packageName);
        }

        packageFilename() {
            return () => `cohort_characterization_study_${this.characterizationId()}_export.zip`;
        }
    }

    return commonUtils.build('characterization-view-edit-utils', CharacterizationViewEditUtils, view);
});
