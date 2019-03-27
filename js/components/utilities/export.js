define([
    'knockout',
    'text!./export.html',
    'appConfig',
    'services/AuthAPI',
    'components/Component',
    'utils/AutoBind',
    'utils/CommonUtils',
    'less!./export.less',
], function (
    ko,
    view,
    config,
    authApi,
    Component,
    AutoBind,
    commonUtils,
) {
    class ExportUtil extends AutoBind(Component) {
        constructor(params) {
            super();

            this.loading = ko.observable(false);

            this.entityId = params.entityId;
            this.isPermittedExport = params.isPermittedExport || (() => false);
            this.exportService = params.exportService;

            this.isExportPermitted = this.isExportPermittedResolver();
            this.exportEntity = ko.observable();
            this.exportJSON = ko.computed(() => JSON.stringify(this.exportEntity(), null, 2));
            this.isExportPermitted() && this.loadExportJSON();
        }

        isExportPermittedResolver() {
            return ko.computed(() => this.isPermittedExport(this.entityId()));
        }

        async loadExportJSON() {
            if (this.entityId() !== 0) {
                this.loading(true);
                const res = await this.exportService(this.entityId());
                this.exportEntity(res);
                this.loading(false);
            }
        }
    }

    return commonUtils.build('export', ExportUtil, view);
});
