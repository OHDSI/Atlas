define([
	'knockout',
	'appConfig',
	'utils/Renderers',
	'services/MomentAPI'
	],
	(
		ko,
		config,
		renderers,
		MomentApi) => {

	  const maxEntityNameLength = 100;
		const minChartHeight = 300;
		const treemapGradient = ["#c7eaff", "#6E92A8", "#1F425A"];
		const defaultDeciles = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-99"];
		const timeAtRiskCohortDate = [{
			name: ko.i18n('ple.spec.options.cohortStartDate', 'cohort start date'),
			id: false,
		  }, {
			name: ko.i18n('ple.spec.options.cohortEndDate', 'cohort end date'),
			id: true
		}];

		const relatedSourcecodesOptions = {
			Facets: [{
				'caption': ko.i18n('facets.caption.vocabulary', 'Vocabulary'),
				'binding': function (o) {
					return o.VOCABULARY_ID;
				}
			}, {
				'caption': ko.i18n('facets.caption.invalidReason', 'Invalid Reason'),
				'binding': function (o) {
					return o.INVALID_REASON_CAPTION;
				}
			}, {
				'caption': ko.i18n('facets.caption.class', 'Class'),
				'binding': function (o) {
					return o.CONCEPT_CLASS_ID;
				}
			}, {
				'caption': ko.i18n('facets.caption.domain', 'Domain'),
				'binding': function (o) {
					return o.DOMAIN_ID;
				}
			}]
		};

		const getLinkedFeAParametersColumns = (context) => {
			return [
				{
					title: ko.i18n('columns.name', 'Name'),
					data: 'name',
					className: context.classes('col-param-name'),
				},
				{
					title: ko.i18n('columns.value', 'Value'),
					data: 'value',
					className: context.classes('col-param-value'),
				},
				... context.isEditPermitted() ? [{
					title: ko.i18n('columns.actions', 'Actions'),
					render: context.getRemoveCell('removeParam', 'name'),
					className: context.classes('col-param-remove'),
				}] : []
			];
		};
		
		const getLinkedFeatureAnalysisColumns = (context) => {
			return [
				{
					title: ko.i18n('columns.id', 'ID'),
					data: 'id',
					className: context.classes('col-feature-id'),
				},
				{
					title: ko.i18n('columns.name', 'Name'),
					data: 'name',
					className: context.classes('col-feature-name'),
				},
				{
					title: ko.i18n('columns.description', 'Description'),
					data: 'description',
					className: context.classes('col-feature-descr'),
				},
				... context.isEditPermitted() ? [{
					title: ko.i18n('columns.actions', 'Actions'),
					render: context.getRemoveCell('removeFeature'),
					className: context.classes('col-feature-remove'),
				}] : []
			];
		};

		const getLinkedCohortColumns = (context, nameCol) => {
			return [
				{
					title: ko.i18n('columns.id', 'ID'),
					data: 'id',
					className: context.classes('col-cohort-id'),
				},
				nameCol,
				... context.isEditPermitted() ? [{
					title: '',
					render: context.getEditCell('editCohort'),
					className: context.classes('col-cohort-edit'),
				},
					{
						title: '',
						render: context.getRemoveCell('removeCohort'),
						className: context.classes('col-cohort-remove'),
					}] : []
			];
		};

		const getRelatedSourcecodesColumns = (sharedState, context, selectAllFn) => [
			{
				title: '',
				orderable: false,
				searchable: false,
				className: 'text-center',
				render: () => renderers.renderCheckbox('isSelected', context.canEditCurrentConceptSet()),
				renderSelectAll: context.canEditCurrentConceptSet(),
				selectAll: selectAllFn
			},
			{
				title: ko.i18n('columns.id', 'Id'),
				data: 'CONCEPT_ID'
			},
			{
				title: ko.i18n('columns.code', 'Code'),
				data: 'CONCEPT_CODE'
			},
			{
				title: ko.i18n('columns.name', 'Name'),
				data: 'CONCEPT_NAME',
				render: function (s, p, d) {
					var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
					return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
				}
			},
			{
				title: ko.i18n('columns.class', 'Class'),
				data: 'CONCEPT_CLASS_ID'
			},
			{
				title: ko.i18n('columns.standardConceptCaption', 'Standard Concept Caption'),
				data: 'STANDARD_CONCEPT_CAPTION',
				visible: false
			},
			{
				title: ko.i18n('columns.validStartDate', 'Valid Start Date'),
				render: (s, type, d) => type === "sort" ? +d['VALID_START_DATE'] :
					MomentApi.formatDateTimeWithFormat(d['VALID_START_DATE'], MomentApi.DATE_FORMAT),
				visible: false
			},
			{
				title: ko.i18n('columns.validEndDate', 'Valid End Date'),
				render: (s, type, d) => type === "sort" ? +d['VALID_END_DATE'] :
					MomentApi.formatDateTimeWithFormat(d['VALID_END_DATE'], MomentApi.DATE_FORMAT),
				visible: false
			},
			{
				title: ko.i18n('columns.rc', 'RC'),
				data: 'RECORD_COUNT',
				className: 'numeric'
			},
			{
				title: ko.i18n('columns.drc', 'DRC'),
				data: 'DESCENDANT_RECORD_COUNT',
				className: 'numeric'
			},
			{
				title: ko.i18n('columns.pc', 'PC'),
				data: 'PERSON_COUNT',
				className: 'numeric',
			},
			{
				title: ko.i18n('columns.dpc', 'DPC'),
				data: 'DESCENDANT_PERSON_COUNT',
				className: 'numeric',
			},
			{
				title: ko.i18n('columns.domain', 'Domain'),
				data: 'DOMAIN_ID'
			},
			{
				title: ko.i18n('columns.vocabulary', 'Vocabulary'),
				data: 'VOCABULARY_ID'
			},
		];

		const apiPaths = {
			role: (id = '') => `${config.api.url}role/${id}`,
			roleUsers: roleId => `${config.api.url}role/${roleId}/users`,
			permissions: () => `${config.api.url}permission`,
			rolePermissions: roleId => `${config.api.url}role/${roleId}/permissions`,
			relations: (roleId, relation, ids = []) => `${config.api.url}role/${roleId}/${relation}/${ids.join('+')}`,
			jobs: () => `${config.api.url}job/execution?comprehensivePage=true`,
			job: (id) => `${config.api.url}job/${id}`,
			jobByName: (name,  type) => `${config.api.url}job/type/${type}/name/${name}`,
		};

		const applicationStatuses = {
			initializing: 'initializing',
			running: 'running',
			noSourcesAvailable: 'no-sources-available',
			failed: 'failed',
		};

		const generationStatuses = {
			STARTED: 'STARTED',
			STARTING: 'STARTING',
			RUNNING: 'RUNNING',
			COMPLETED: 'COMPLETED',
			FAILED: 'FAILED',
			PENDING: 'PENDING',
		};

		const executionStatuses = {
			STARTED: 'STARTED',
			COMPLETED: 'COMPLETED',
			PENDING: 'STARTING',
			FAILED: 'FAILED',
			CANCELED: 'STOPPED',
			STOPPING: 'STOPPING',
			RUNNING: 'RUNNING',
		};

		const executionResultModes = {
			DOWNLOAD: 'DOWNLOAD',
			VIEW: 'VIEW',
		}

		const newEntityNames = {
			characterization: ko.i18n('const.newEntityNames.characterization', 'New Characterization'),
			featureAnalysis: ko.i18n('const.newEntityNames.featureAnalysis', 'New Feature Analysis'),
			cohortDefinition: ko.i18n('const.newEntityNames.cohortDefinition', 'New Cohort Definition'),
			incidenceRate: ko.i18n('const.newEntityNames.incidenceRate', 'New Incidence Rate Analysis'),
			pathway: ko.i18n('const.newEntityNames.pathway', 'New Cohort Pathway'),
			ple: ko.i18n('const.newEntityNames.ple', 'New Population Level Estimation Analysis'),
			conceptSet: ko.i18n('const.newEntityNames.conceptSet', 'New Concept Set'),
			plp: ko.i18n('const.newEntityNames.plp', 'New Patient Level Prediction Analysis'),
			reusable: ko.i18n('const.newEntityNames.reusable', 'New Reusable'),
		};

		const pluginTypes = {
			COHORT_REPORT: 'atlas-cohort-report',
			PROFILE_WIDGET: 'atlas-profile-widget',
		};

		const sqlDialects = {
			MSSQL: {
				title: "MSSQL Server",
				dialect: "sql server",
			},
			MSAPS: {
				title: "MS APS",
				dialect: "pdw",
			},
			ORACLE: {
				title: "Oracle",
				dialect: "oracle",
			},
			POSTGRESQL: {
				title: "PostgreSQL",
				dialect: "postgresql",
			},
			REDSHIFT: {
				title: "Amazon Red Shift",
				dialect: "redshift",
			},
			IMPALA: {
				title: "Impala",
				dialect: "impala",
			},
			NETEZZA: {
				title: "Netezza",
				dialect: "netezza",
			},
			BIGQUERY: {
				title: "Big Query",
				dialect: "bigquery",
			},
			HIVE: {
				title: "Apache Hive",
				dialect: "hive",
			},
			SPARK: {
				title: "Spark",
				dialect: "spark",
			},
			SNOWFLAKE: {
				title: "Snowflake",
				dialect: "snowflake",
      },
			SYNAPSE: {
				title: "Azure Synapse",
				dialect: "synapse",
			},
		};

		const eventTypes = {
			conceptSetChanged: 'conceptSetChanged',
		};


		const jobTypes = {
			USER_JOB: {
				title: 'userJob',
				ownerType: 'USER_JOB',
			},
			ALL_JOB: {
				title: 'allJob',
				ownerType: 'ALL_JOB',
			},
		};

		const disabledReasons = {
			DIRTY: ko.i18n('const.disabledReason.dirty', 'Save changes before generate'),
			ACCESS_DENIED: ko.i18n('const.disabledReason.accessDenied', 'Access denied'),
			INVALID_TAR: ko.i18n('const.disabledReason.invalidTar', 'Invalid TAR'),
			INVALID_DESIGN: ko.i18n('const.disabledReason.invalidDesign', 'Design is not valid'),
			ENGINE_NOT_AVAILABLE: ko.i18n('const.disabledReason.engineNotAvalable', 'Execution engine is not available'),
			EMPTY_COHORTS: ko.i18n('const.disabledReason.emptyCohorts', 'No cohorts found'),
			EMPTY_INITIAL_EVENT: ko.i18n('const.disabledReason.emptyInitionEvent', 'Initial event is not set')
		};

		const reusableTypes = {
			INITIAL_EVENT: ko.i18n('const.reusableTypes.initialEvent', 'Initial/Censoring Event'),
			CRITERIA_GROUP: ko.i18n('const.reusableTypes.censoringEvent', 'Criteria Group')
		};

		return {
			maxEntityNameLength,
			minChartHeight,
			treemapGradient,
			defaultDeciles,
			relatedSourcecodesOptions,
			getLinkedFeAParametersColumns,
			getLinkedFeatureAnalysisColumns,
			getLinkedCohortColumns,
			getRelatedSourcecodesColumns,
			apiPaths,
			applicationStatuses,
			generationStatuses,
			timeAtRiskCohortDate,
			newEntityNames,
			pluginTypes,
			executionStatuses,
			executionResultModes,
			sqlDialects,
			eventTypes,
			jobTypes,
			disabledReasons,
			reusableTypes,
    };
  }
);