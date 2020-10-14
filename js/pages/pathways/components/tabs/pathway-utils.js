define([
	'knockout',
	'../../PathwayService',
	'../../PermissionService',
	'text!./pathway-utils.html',
	'appConfig',
	'services/AuthAPI',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'less!./pathway-utils.less',
], function (
	ko,
	PathwayService,
	PermissionService,
	view,
	config,
	authApi,
	Component,
	AutoBind,
	commonUtils
) {
	class PathwayUtils extends AutoBind(Component) {
		constructor(params) {
			super();

			this.loading = ko.observable(false);

			this.MODE_JSON = 0;
			this.MODE_IMPORT = 1;

			this.dirtyFlag = params.dirtyFlag;
			this.analysisId = params.analysisId;
			this.mode = ko.observable(this.MODE_JSON);

			this.isExportPermitted = PermissionService.isPermittedExport;
			this.isImportPermitted = PermissionService.isPermittedImport;

			this.exportEntity = ko.observable();
			this.exportService = PathwayService.loadExportDesign;
			this.importService = PathwayService.importPathwayDesign;
			this.afterImportSuccess = params.afterImportSuccess;

			this.subscriptions = [];
			// subscriptions
			this.subscriptions.push(this.analysisId.subscribe((newVal) => {
				this.loadExportJSON();
				console.log(`New value of analysisId: ${newVal}`);
			}));
		}

		setMode(mode) {
			this.mode(mode);
		}

		async loadExportJSON() {
			if (this.analysisId() !== 0) {
				this.loading(true);
				const res = await PathwayService.loadExportDesign(this.analysisId());
				this.exportEntity(res);
				this.loading(false);
			}
		}

		dispose() {
			this.subscriptions.forEach(s => s.dispose());
		}
	}

	return commonUtils.build('pathway-utils', PathwayUtils, view);
});
