define([
	'knockout',
	'text!./ConceptSetBrowserTemplate.html',
	'services/VocabularyProvider',
	'appConfig',
	'components/conceptset/InputTypes/ConceptSet',
	'services/AuthAPI',
	'utils/DatatableUtils',
	'utils/CommonUtils',
	'services/ConceptSet',
	'components/ac-access-denied',
	'databindings',
	'css!./style.css'
], function (ko, template, VocabularyProvider, appConfig, ConceptSet, authApi, datatableUtils, commonUtils, conceptSetService) {
	function CohortConceptSetBrowser(params) {
		var self = this;

		function defaultRepositoryConceptSetSelected(conceptSet, source) {
			// Default functionality
			self.isProcessing(true);
			VocabularyProvider.getConceptSetExpression(conceptSet.id, source.url)
				.then((result) => {
					var isCancelled = false;
					while (self.cohortConceptSets().find(cs => cs.name() == conceptSet.name) != null && !isCancelled)
					{
						var newName = prompt('Duplicate Concept Name. Please enter a new name', conceptSet.name);
						if (newName) {
							conceptSet.name = newName;
						} else {
							isCancelled = true;
						}
					}
					if (!isCancelled)
					{
						var newId = self.cohortConceptSets().length > 0 ? Math.max.apply(null, self.cohortConceptSets().map(d => d.id)) + 1 : 0;
						var newConceptSet = new ConceptSet({
							id: newId,
							name: conceptSet.name,
							expression: result
						});
						params.$raw.cohortConceptSets().push(newConceptSet);
						self.criteriaContext() && self.criteriaContext().conceptSetId(newConceptSet.id);
						self.onActionComplete({
							action: 'load',
							status: 'Success'
						});					
					} else {
						self.onActionComplete({
							action: 'load',
							status: 'Cancelled'
						});
					}
					// Waiting for modal's amination to end
					setTimeout(() => {
						self.isProcessing(false);
					}, 1000);	
				})
				.catch((err) => {
					console.log(err);
				});
		}

		function setDisabledConceptSetButton(action) {
			if (action && action()) {
				return action()
			} else {
				return false;
			}
		}

		// Helper function to get the latest version approval for a concept set
		// approvalsByVersion structure: { version: ReviewActionDTO }
		function getLatestVersionApproval(approvalsByVersion) {
			if (!approvalsByVersion || typeof approvalsByVersion !== 'object') {
				return null;
			}
			
			// Get all version numbers and find the maximum
			const versions = Object.keys(approvalsByVersion).map(v => parseInt(v));
			if (versions.length === 0) {
				return null;
			}
			
			const maxVersion = Math.max(...versions);
			const latestVersionApproval = approvalsByVersion[maxVersion];
			
			if (!latestVersionApproval) {
				return null;
			}
			
			// Only return if it's an APPROVE type (not REVOKE)
			return latestVersionApproval.type === 'APPROVE' ? latestVersionApproval : null;
		}

		self.datatableUtils = datatableUtils;
		self.criteriaContext = params.criteriaContext;
		self.cohortConceptSets = params.cohortConceptSets;
		self.onActionComplete = params.onActionComplete;
		self.onRespositoryConceptSetSelected = params.onRespositoryConceptSetSelected || defaultRepositoryConceptSetSelected;
		self.disableConceptSetButton = setDisabledConceptSetButton(params.disableConceptSetButton);
		self.buttonActionEnabled = params.buttonActionEnabled !== false;
		self.buttonActionText = params.buttonActionText || ko.i18n('const.newEntityNames.conceptSet', 'New Concept Set');
		self.repositoryConceptSetTableId = params.repositoryConceptSetTableId || "repositoryConceptSetTable";

		self.loading = ko.observable(false);
		self.repositoryConceptSets = ko.observableArray();
		self.isProcessing = ko.observable(false);

		self.sources = [];
		self.sources.push(appConfig.api);
		self.selectedSource = ko.observable(self.sources[0]);

		self.isAuthenticated = authApi.isAuthenticated;
		self.canReadConceptsets = ko.pureComputed(function () {
		  return (appConfig.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedReadConceptsets()) || !appConfig.userAuthenticationEnabled;
		});
		self.canReadCohorts = ko.pureComputed(function () {
		  return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedReadCohorts()) || !config.userAuthenticationEnabled;
		});

		self.loadConceptSetsFromRepository = function (url) {
			self.loading(true);

			VocabularyProvider.getConceptSetList(url)
				.done(function (results) {
					datatableUtils.coalesceField(results, 'modifiedDate', 'createdDate');
					datatableUtils.addTagGroupsToFacets(results, self.options.Facets);

					const conceptSetIds = results.map(cs => cs.id);

						// Enrich with approval status and additional fields for the table
						conceptSetService.getApprovalInfoBatch(conceptSetIds)
							.then(approvalMap => {
								// approvalMap structure: { conceptSetId: { version: ReviewActionDTO } }
								results.forEach(conceptSet => {
									try {
										// Get all approvals for this concept set (by version)
										const approvalsByVersion = approvalMap[conceptSet.id] || {};

										// Get the approval for the LATEST VERSION
										const latestVersionApproval = getLatestVersionApproval(approvalsByVersion);

										conceptSet.isApproved = !!latestVersionApproval;
										conceptSet.approver = latestVersionApproval ? latestVersionApproval.user.name : null;
										conceptSet.approvalDate = latestVersionApproval ? latestVersionApproval.timestamp : null;
									} catch (error) {
										console.error(`Error processing approval info for concept set ${conceptSet.id}:`, error);
										// Set default values if there's an error
										conceptSet.isApproved = false;
										conceptSet.approver = null;
										conceptSet.approvalDate = null;
									}
								});

							self.repositoryConceptSets(results);
							datatableUtils.addTagGroupsToColumns(results, self.columns);
							self.loading(false);
						}).catch(error => {
							console.error('Error while batch-fetching approval info for concept sets', error);
							results.forEach(conceptSet => {
								conceptSet.isApproved = false;
								conceptSet.approver = null;
								conceptSet.approvalDate = null;
							});
							self.repositoryConceptSets(results);
							datatableUtils.addTagGroupsToColumns(results, self.columns);
							self.loading(false);
						});
				})
				.fail(function (err) {
					console.log('Error fetching concept sets:', err);
					self.loading(false);
				});
		}

		// datatable callbacks:

		self.selectRepositoryConceptSet = function (data, context, event) {
			!self.isProcessing() && self.onRespositoryConceptSetSelected(data, self.selectedSource(), event);
		}

		self.addConceptSet = function () {
			self.onActionComplete({
				action: 'add',
				status: 'Success'
			});
		}

		// dispose subscriptions

		// startup actions
		self.loadConceptSetsFromRepository(self.selectedSource().url);

		this.options = {
			Facets: [
				{
					'caption': ko.i18n('facets.caption.created', 'Created'),
					'binding': (o) => datatableUtils.getFacetForDate(o.createdDate)
				},
				{
					'caption': ko.i18n('facets.caption.updated', 'Updated'),
					'binding': (o) => datatableUtils.getFacetForDate(o.modifiedDate)
				},
				{
					'caption': ko.i18n('facets.caption.author', 'Author'),
					'binding': datatableUtils.getFacetForCreatedBy,
				},
				{
					'caption': ko.i18n('facets.caption.designs', 'Designs'),
					'binding': datatableUtils.getFacetForDesign,
				},
				{
					'caption': ko.i18n('facets.caption.validated', 'Validated'),
					'binding': (o) => {
						return o.isApproved ? ko.i18n('common.yes', 'Yes')() : ko.i18n('common.no', 'No')();
					}
				},
				{
					'caption': ko.i18n('facets.caption.validatedBy', 'Validated By'),
					'binding': (o) => {
						return o.approver || ko.i18n('common.notValidated', 'Not Validated')();
					}
				},
				{
					'caption': ko.i18n('facets.caption.validatedDate', 'Validated Date'),
					'binding': (o) => {
						if (!o.approvalDate) {
							return ko.i18n('common.notValidated', 'Not Validated')();
						}
						return datatableUtils.getFacetForDate(o.approvalDate);
					}
				},
			]
		};

		this.columns = ko.observableArray([
			{
				title: '',
				data: 'isApproved',
				sortable: false,
				defaultContent: '',
				createdCell: function (td, cellData, rowData, row, col) {
					if (cellData) {
						$(td).html('<i class="fa fa-check-circle" style="font-size:15px;color:green" title="Validated"></i>');
					} else {
						$(td).html('');
					}
				},
				width: '20px', 
			},			
			{
				title: ko.i18n('columns.id', 'Id'),
				data: 'id'
			},
			{
				title: ko.i18n('columns.name', 'Name'),
				render: datatableUtils.getLinkFormatter(d => ({
					label: d['name'],
					linkish: true,
				})),
			},
			{
				title: ko.i18n('columns.created', 'Created'),
				render: datatableUtils.getDateFieldFormatter('createdDate'),
			},
			{
				title: ko.i18n('columns.updated', 'Updated'),
				render: datatableUtils.getDateFieldFormatter('modifiedDate'),
			},
			{
				title: ko.i18n('columns.author', 'Author'),
				render: datatableUtils.getCreatedByFormatter(),
			},
			{
				title: ko.i18n('columns.validatedBy', 'Validated By'),
				data: 'approver',
				render: function (data, type, row) {
					return data || '-';
				}
			},
			{
				title: ko.i18n('columns.validatedDate', 'Validation Date'),
				data: 'approvalDate',
				render: function (data, type, row) {
					return data ? datatableUtils.getDateFieldFormatter('approvalDate')({approvalDate: data}, type, row) : '-';
				}
			}
		]);
		
		const { pageLength, lengthMenu } = commonUtils.getTableOptions('M');
		this.pageLength = params.pageLength || pageLength;
		this.lengthMenu = params.lengthMenu || lengthMenu;
	}
	
	var component = {
		viewModel: CohortConceptSetBrowser,
		template: template
	};

	return component;
});