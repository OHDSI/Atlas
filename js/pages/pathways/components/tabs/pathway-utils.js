define([
    'knockout',
    '../../PathwayService',
		'../../PermissionService',
    'text!./pathway-utils.html',
    'providers/Component',
    'providers/AutoBind',
		'utils/CommonUtils',
    'less!./pathway-utils.less',
], function (
	ko,
	PathwayService,
	PermissionService,
	view,
	Component,
	AutoBind,
	commonUtils
) {
	class PathwayUtils extends AutoBind(Component) {
		constructor(params) {
			super();

			this.subscriptions = [];
			
			this.loading = ko.observable(false);

			this.MODE_JSON = 0;
			this.MODE_IMPORT = 1;

			this.analysisId = params.analysisId;
			this.mode = ko.observable(this.MODE_JSON);

			this.isExportPermitted = this.isExportPermittedResolver();
			this.isImportPermitted = this.isImportPermittedResolver();

			this.exportEntity = ko.observable();
			this.exportJSON = ko.computed(() => JSON.stringify(this.exportEntity(), null, 2));

			this.importJSON = ko.observable();

			this.isExportPermitted() && this.loadExportJSON();
			
			// subscriptions
			this.subscriptions.push(this.analysisId.subscribe((newVal) => {
				this.loadExportJSON();
				console.log(`New value of analysisId: ${newVal}`);
			}));
		}

		isExportPermittedResolver() {
			return ko.computed(() => PermissionService.isPermittedExport(this.analysisId()));
		}

		isImportPermittedResolver() {
			return PermissionService.isPermittedImport;
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

		doImport() {
			this.loading(true);

			PathwayService
				.importPathwayDesign(JSON.parse(this.importJSON()))
				.then(res => {
					this.loading(false);
					commonUtils.routeTo(`/pathways/${res.id}`);
				});
		}
		
		dispose() {
			this.subscriptions.forEach(s => s.dispose());
		}
	}

	return commonUtils.build('pathway-utils', PathwayUtils, view);
});
