define([
	'knockout',
	'appConfig',
	'utils/Renderers'
	],
	(
		ko,
		config,
		renderers) => {

		const minChartHeight = 300;
		const treemapGradient = ["#c7eaff", "#6E92A8", "#1F425A"];
		const defaultDeciles = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-99"];
		const timeAtRiskCohortDate = [{
			name: "cohort start date",
			id: false,
		  }, {
			name: "cohort end date",
			id: true
		}];


		const relatedSourcecodesOptions = {
			Facets: [{
				'caption': 'Vocabulary',
				'binding': function (o) {
					return o.VOCABULARY_ID;
				}
			}, {
				'caption': 'Invalid Reason',
				'binding': function (o) {
					return o.INVALID_REASON_CAPTION;
				}
			}, {
				'caption': 'Class',
				'binding': function (o) {
					return o.CONCEPT_CLASS_ID;
				}
			}, {
				'caption': 'Domain',
				'binding': function (o) {
					return o.DOMAIN_ID;
				}
			}]
		};

		const getLinkedFeAParametersColumns = (context) => {
			return [
				{
					title: 'Name',
					data: 'name',
					className: context.classes('col-param-name'),
				},
				{
					title: 'Value',
					data: 'value',
					className: context.classes('col-param-value'),
				},
				... context.isEditPermitted() ? [{
					title: 'Actions',
					render: context.getRemoveCell('removeParam', 'name'),
					className: context.classes('col-param-remove'),
				}] : []
			];
		};
		
		const getLinkedFeatureAnalysisColumns = (context) => {
			return [
				{
					title: 'ID',
					data: 'id',
					className: context.classes('col-feature-id'),
				},
				{
					title: 'Name',
					data: 'name',
					className: context.classes('col-feature-name'),
				},
				{
					title: 'Description',
					data: 'description',
					className: context.classes('col-feature-descr'),
				},
				... context.isEditPermitted() ? [{
					title: 'Actions',
					render: context.getRemoveCell('removeFeature'),
					className: context.classes('col-feature-remove'),
				}] : []
			];
		};

		const getLinkedCohortColumns = (context, nameCol) => {
			return [
				{
					title: 'ID',
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
				
		const getRelatedSourcecodesColumns = (sharedState, context) => [
			{
				title: '',
				orderable: false,
				searchable: false,
				className: 'text-center',
				render: () => renderers.renderCheckbox('isSelected', context.canEditCurrentConceptSet()),
			},
			{
				title: 'Id',
				data: 'CONCEPT_ID'
			},
			{
				title: 'Code',
				data: 'CONCEPT_CODE'
			},
			{
				title: 'Name',
				data: 'CONCEPT_NAME',
				render: function (s, p, d) {
					var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
					return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
				}
			},
			{
				title: 'Class',
				data: 'CONCEPT_CLASS_ID'
			},
			{
				title: 'Standard Concept Caption',
				data: 'STANDARD_CONCEPT_CAPTION',
				visible: false
			},
			{
				title: 'Domain',
				data: 'DOMAIN_ID'
			},
			{
				title: 'Vocabulary',
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
			characterization: 'New Characterization',
			featureAnalysis: 'New Feature Analysis',
			cohortDefinition: "New Cohort Definition",
			incidenceRate: "New Incidence Rate Analysis",
			pathway: 'New Cohort Pathway',
			ple: 'New Population Level Estimation Analysis',
			conceptSet: 'New Concept Set',
			plp: 'New Patient Level Prediction Analysis',
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
			DIRTY: 'Save changes before generate',
			ACCESS_DENIED: 'Access denied',
			INVALID_TAR: 'Invalid TAR',
			INVALID_DESIGN: 'Design is not valid',
			ENGINE_NOT_AVAILABLE: 'Execution engine is not available',
			EMPTY_COHORTS: 'No cohorts found',
			EMPTY_INITIAL_EVENT: 'Initial event is not set',
		};

		return {
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
			disabledReasons,
			jobTypes,
    };
  }
);