define([
    'knockout',
    'text!./import.html',
    'appConfig',
    'services/AuthAPI',
    'components/Component',
    'utils/AutoBind',
    'utils/CommonUtils',
    'less!./import.less',
], function (
    ko,
    view,
    config,
    authApi,
    Component,
    AutoBind,
    commonUtils,
) {
    class Import extends AutoBind(Component) {
        constructor(params) {
            super();

            this.loading = ko.observable(false);

            this.entityId = params.entityId;
            this.routeToUrl = params.routeToUrl;
            this.isPermittedImport = params.isPermittedImport || (() => false);
            this.importService = params.importService;
            this.isImportPermitted = this.isImportPermittedResolver();
            this.importJSON = params.importJSON ? params.importJSON : ko.observable();
            this.isJSONValid = params.isJSONValid ? params.isJSONValid : ko.observable(true);

            this.afterImportSuccess = params.afterImportSuccess || ((res) => commonUtils.routeTo(this.routeToUrl + res.id));
        }

        isImportPermittedResolver() {
            return this.isPermittedImport;
        }

        async doImport() {
            this.loading(true);
            try {
                const res = await this.importService(JSON.parse(this.importJSON()));
                this.afterImportSuccess(res);
            } catch (e) {
                alert("Import failed, please, ensure that importing JSON is valid!");
            } finally {
                this.loading(false);
            }
        }
    }

    return commonUtils.build('import', Import, view);
});
