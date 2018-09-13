define([
	'knockout',
	'text!./manager.html',
	'../PathwayService',
	'../PermissionService',
	'../PathwayAnalysis',
	'atlas-state',
	'appConfig',
	'webapi/AuthAPI',
	'providers/Page',
	'utils/CommonUtils',
	'assets/ohdsi.util',
	'less!./manager.less',
	'components/tabs',
	'./tabs/pathway-design',
	'./tabs/pathway-exec-wrapper',
	'./tabs/pathway-results',
	'./tabs/pathway-utils',
	'faceted-datatable'
], function (
	ko,
	view,
	PathwayService,
	PermissionService,
	PathwayAnalysis,
	sharedState,
	config,
	authApi,
	Page,
	commonUtils,
	ohdsiUtil
) {
	class PathwaysManager extends Page {
		constructor(params) {
			super(params);

			// bind to class methods
			this.selectTab = this.selectTab.bind(this);
			this.setupDesign = this.setupDesign.bind(this);
			this.setupSection = this.setupSection.bind(this);			
			this.load = this.load.bind(this);
			this.del = this.del.bind(this);
			this.close = this.close.bind(this);

			this.design = sharedState.CohortPathways.current;
			this.dirtyFlag = sharedState.CohortPathways.dirtyFlag;
			this.analysisId = ko.observable();
			this.executionId = ko.observable();

			this.loading = ko.observable(false);
			this.canEdit = this.isEditPermittedResolver();
			this.canSave = this.isSavePermittedResolver();
			this.canDelete = this.isDeletePermittedResolver();

			this.selectedTabKey = ko.observable("design");
			this.componentParams = {
				design: this.design,
				analysisId: this.analysisId,
				executionId: this.executionId,
			};

		}

		onRouterParamsChanged({analysisId, section, subId}) {
			if (analysisId !== undefined) {
				this.analysisId(parseInt(analysisId));
				this.load(this.analysisId() || 0);
			}
			this.setupSection(section);
			this.executionId(subId);
		}

		selectTab(index, { key }) {
			commonUtils.routeTo(`/pathways/${this.componentParams.analysisId()}/${key}`);
		}
		
		setupDesign(design) {
			this.design(design);
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.design()));
		}
		
	 setupSection(section) {
				const tabKey = section === 'results' ? 'executions' : section;
				this.selectedTabKey(tabKey || 'design');
		}
		
		isEditPermittedResolver() {
				return ko.computed(
						() => (this.analysisId() ? PermissionService.isPermittedUpdate(this.analysisId()) : PermissionService.isPermittedCreate())
				);
		}

		isSavePermittedResolver() {
				return ko.computed(() => this.canEdit() && this.dirtyFlag().isDirty())
		}

		isDeletePermittedResolver() {
				return ko.computed(
						() => (this.analysisId() ? PermissionService.isPermittedDelete(this.analysisId()) : false)
				);
		}
		

		load(id) {
			if(this.dirtyFlag().isDirty() && !confirm("Your changes are not saved. Would you like to continue?"))
				return;
			
			if (id < 1) {
				this.setupDesign(new PathwayAnalysis());
			} else {
				this.loading(true);
				PathwayService
					.load(id)
					.then(res => {
						this.setupDesign(new PathwayAnalysis(res))
						this.loading(false);
					});
			}
		}
		
		save() {
			if (!this.design().id) {
				PathwayService
					.create(this.design())
					.then(res => {
						this.dirtyFlag().reset();
						commonUtils.routeTo(`pathways/${res.id}/design`);
				});
			} else {
				PathwayService
					.save(this.design().id, this.design())
					.then(res => {
						this.setupDesign(new PathwayAnalysis(res));
						this.loading(false);
					});
			}
		}

		del() {
			if (confirm('Are you sure?')) {
				this.loading(true);
				PathwayService
					.del(this.design().id)
					.then(res => {
						this.dirtyFlag().reset();					
						this.loading(false);
						this.close();
					});
			}
		}

		close() {
			if (this.dirtyFlag().isDirty() && !confirm("Your changes are not saved. Would you like to continue?")) {
				return;
			}
			this.design(null);
			this.dirtyFlag().reset();
			
			commonUtils.routeTo('/pathways');
		}

	}

	return commonUtils.build('pathways-manager', PathwaysManager, view);
});
