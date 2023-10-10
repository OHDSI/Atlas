define([
	'knockout',
	'text!./ConceptSetBrowserTemplate.html',
	'services/VocabularyProvider',
	'appConfig',
	'components/conceptset/InputTypes/ConceptSet',
	'services/AuthAPI',
	'utils/DatatableUtils',
	'utils/CommonUtils',
	'components/ac-access-denied',
	'databindings',
	'css!./style.css'
], function (ko, template, VocabularyProvider, appConfig, ConceptSet, authApi, datatableUtils, commonUtils) {
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
					datatableUtils.addTagGroupsToColumns(results, self.columns);
					self.repositoryConceptSets(results);
					self.loading(false);
				})
				.fail(function (err) {
					console.log(err);
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
			]
		};

		this.columns = ko.observableArray([
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
