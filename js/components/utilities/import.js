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
            this.importJSON = ko.observable();
        }

        isImportPermittedResolver() {
            return this.isPermittedImport;
        }

        async doImport() {
            this.loading(true);
            const res = await this.importService(JSON.parse(this.importJSON()));
            this.loading(false);
            commonUtils.routeTo(this.routeToUrl + res.id);
        }
    }

    return commonUtils.build('import', Import, view);
});
