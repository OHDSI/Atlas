define([
    'knockout',
    'text!./export.html',
    'appConfig',
    'services/AuthAPI',
    'components/Component',
    'utils/Clipboard',
    'utils/AutoBind',
    'utils/CommonUtils',
    './const',
    'less!./export.less',
], function (
    ko,
    view,
    config,
    authApi,
    Component,
    Clipboard,
    AutoBind,
    commonUtils,
    constants,
) {
    class ExportUtil extends AutoBind(Clipboard(Component)) {
        constructor(params) {
            super();
            const { entityId, message = {}, isPermittedExport = () => false, exportService, dirtyFlag } = params;
            // unique identifier is need to avoid conflicts with other export buttons on the page
            this.uniqueId = commonUtils.getUniqueIdentifier();
            this.loading = ko.observable(false);
            this.entityId = entityId;
            this.isPermittedExport = isPermittedExport;
            this.exportService = exportService;
            this.dirtyFlag = dirtyFlag;
            this.message = message;
            this.isExportPermitted = this.isExportPermittedResolver();
            this.isExportForUnsavedEntityPermitted = this.isExportForUnsavedEntityPermittedResolver();
            this.canExport = ko.pureComputed(() => this.isExportForUnsavedEntityPermitted() && this.isExportPermitted());
            this.exportEntity = ko.observable();
            this.errorMessage = this.messageResolver();
            this.exportJSON = ko.pureComputed(() => JSON.stringify(this.exportEntity(), null, 2));
            this.canExport() && this.loadExportJSON();
            this.subscriptions = [];
            this.subscriptions.push(this.canExport.subscribe(v => !!v && this.loadExportJSON()));
        }

        isExportPermittedResolver() {
            return ko.pureComputed(() => this.isPermittedExport(this.entityId()));
        }

        isExportForUnsavedEntityPermittedResolver() {
            return ko.pureComputed(() => this.dirtyFlag ? !this.dirtyFlag().isDirty() : true);
        }

        messageResolver() {
            const { entityName = 'entity', template = constants.MESSAGE_TEMPLATES.UNSAVED } = this.message;
            const messageForUnsavedEntity = this.transformTemplateToMesage(template, entityName);
            const messageForUnpermittedExport = this.transformTemplateToMesage(constants.MESSAGE_TEMPLATES.UNPERMITTED, entityName);
            return ko.pureComputed(() => {
                return !this.isExportForUnsavedEntityPermitted()
                    ? messageForUnsavedEntity : !this.isExportPermitted()
                    ? messageForUnpermittedExport : '';
            });
        }

        transformTemplateToMesage(template, entityName) {
            return template.replace('%s', entityName);
        }


        dispose() {
            this.subscriptions.forEach(s => s.dispose());
        }

        async loadExportJSON() {
            if (this.entityId() !== 0 && this.entityId() !== '0') {
                this.loading(true);
                const res = await this.exportService(this.entityId());
                this.exportEntity(res);
                this.loading(false);
            }
        }

        copyExpressionToClipboard() {
            this.copyToClipboard('#btnCopyToClipboard' + this.uniqueId, '#copyExpressionToClipboardMessage' + this.uniqueId);
        }
    }

    return commonUtils.build('export', ExportUtil, view);
});
