define([
	'knockout',
	'text!./job-manager.html',
	'pages/Page',
	'utils/AutoBind',
	'utils/CommonUtils',
	'services/Jobs',
	'appConfig',
	'services/MomentAPI',
	'services/AuthAPI',
	'databindings',
	'components/ac-access-denied',
	'components/heading',
	'../configuration/components/modal/conceptset-batch-compare-modal',
	'less!./job-manager.less'
],
	function (
		ko,
		view,
		Page,
		AutoBind,
		commonUtils,
		JobsService,
		config,
		momentApi,
		authApi
	) {
		class JobManager extends AutoBind(Page) {
			constructor(params) {
				super(params);
				this.jobs = ko.observableArray([]);
				this.isLoading = ko.observable(false);
				this.downloading = ko.observable(null);
				this.isBatchCompareModalShown = ko.observable(false);

				const { pageLength, lengthMenu } = commonUtils.getTableOptions('L');
				this.pageLength = pageLength;
				this.lengthMenu = lengthMenu;

				// permission checks to be BEFORE using them in computed observables
				this.isAuthenticated = authApi.isAuthenticated;
				this.canReadJobs = ko.pureComputed(() => {
					return authApi.isPermittedReadJobs();
				});
				
				this.canBatchCompare = ko.pureComputed(() => {
					return authApi.isPermittedBatchCompare();
				});

				this.columns = ko.computed(() => {
					const baseColumns = [
						{ title: ko.i18n('columns.executionId', 'Execution Id'), data: 'executionId' },
						{ title: ko.i18n('columns.jobName', 'Job Name'), data: 'jobParameters.jobName' },
						{ title: ko.i18n('columns.status', 'Status'), data: 'status' },
						{ title: ko.i18n('columns.startDate', 'Start Date'), data: 'startDate' },
						{ title: ko.i18n('columns.endDate', 'End Date'), data: 'endDate' }
					];

					if (config.userAuthenticationEnabled) {
						baseColumns.splice(3, 0, {
							title: ko.i18n('columns.author', 'Author'),
							data: 'jobParameters.jobAuthor',
							defaultContent: ''
						});
					}
					
					if (this.canBatchCompare()) {
						baseColumns.push({
							title: ko.i18n('columns.actions', 'Actions'),
							sortable: false,
							className: 'text-center',
							render: (d, t, r) => {
								if (r.hasArtifact === true) {
									const downloading = this.downloading();
									if (downloading === r.executionId) {
										return '<i class="fa fa-spinner fa-spin downloadArtifactIcon" title="Downloading..."></i>';
									}
									return `<i class="downloadArtifactIcon fa fa-download" aria-hidden="true" title="${ko.i18n('jobs.downloadArtifact', 'Download Artifact')}"></i>`;
								}
								return '<span class="text-muted">—</span>';
							}
						});
					}

					return baseColumns;
				});

				if (this.canReadJobs()) {
					this.updateJobs();
				}

				// Subscribe to modal close event to refresh jobs
				this.isBatchCompareModalShown.subscribe((isShown) => {
					if (!isShown) {
						// Modal was closed, refresh the jobs list
						this.updateJobs();
					}
				});
			}

			async updateJobs() {
				this.isLoading(true);
				try {
					const jobs = await JobsService.getList();
					
					const processedJobs = jobs.map((job) => {
						const { startDate = null, endDate = null } = job;
						job.startDate = startDate ? momentApi.formatDateTime(new Date(startDate)) : '-';
						job.endDate = endDate && (endDate > startDate) ? momentApi.formatDateTime(new Date(endDate)) : '-';
						job.jobParameters.jobName == undefined && (job.jobParameters.jobName = 'n/a');
						return job;
					});
					
					this.jobs(processedJobs);
					
				} catch (ex) {
					console.error('Failed to load jobs:', ex);
				} finally {
					this.isLoading(false);
				}
			}

			async onRowClick(d, e) {
				// Only process row clicks if user has batch compare permission
				if (!this.canBatchCompare()) {
					return;
				}
				
				try {
					const { executionId } = d;
					if (e.target.className.includes('downloadArtifactIcon')) {
						await this.downloadArtifact(executionId);
					}
				} catch (ex) {
					console.error('Row click error:', ex);
				}
			}

			async downloadArtifact(executionId) {
				if (this.downloading() === executionId) {
					return; // Already downloading
				}

				this.downloading(executionId);
				
				// Trigger re-render to show spinner
				this.jobs.valueHasMutated();

				try {
					await JobsService.downloadArtifact(executionId);
				} catch (error) {
					console.error('Failed to download artifact:', error);

					// Helper function to unwrap i18n values
					const getText = (key, defaultText) => {
						const value = ko.i18n(key, defaultText);
						// Check if it's a knockout observable or computed
						return ko.isObservable(value) ? value() : String(value);
					};

					// Create a meaningful error message
					let errorMessage = '';

					if (error && typeof error === 'object' && 'status' in error) {
						const status = error.status;
						const statusText = error.statusText || '';

						switch (status) {
							case 204:
								errorMessage = getText('jobs.noArtifactAvailable', 'No artifact available for this job.');
								break;
							case 404:
								errorMessage = getText('jobs.artifactNotFound', 'Artifact not found.');
								break;
							case 403:
								errorMessage = getText('jobs.artifactForbidden', 'You do not have permission to download this artifact.');
								break;
							case 500:
								errorMessage = getText('jobs.artifactServerError', 'Server error occurred while generating artifact.');
								break;
							default:
								errorMessage = getText('jobs.downloadError', 'Failed to download artifact. Please try again.');
								if (statusText) {
									errorMessage += ` (${status}: ${statusText})`;
								} else {
									errorMessage += ` (Status: ${status})`;
								}
						}
					} else {
						errorMessage = getText('jobs.downloadError', 'Failed to download artifact. Please try again.');
					}

					alert(errorMessage);
				} finally {
					this.downloading(null);
					// Trigger re-render to remove spinner
					this.jobs.valueHasMutated();
				}
			}

			runConceptSetDiffReport() {
				this.isBatchCompareModalShown(true);
			}
		}

		return commonUtils.build('job-manager', JobManager, view);
	});