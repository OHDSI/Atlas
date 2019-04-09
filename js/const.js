define([
	'knockout',
	'appConfig',
	],
	(
		ko,
    	config,
	) => {

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
		const relatedConceptsOptions = {
			Facets: [{
				'caption': 'Vocabulary',
				'binding': function (o) {
					return o.VOCABULARY_ID;
				}
			}, {
				'caption': 'Standard Concept',
				'binding': function (o) {
					return o.STANDARD_CONCEPT_CAPTION;
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
			}, {
				'caption': 'Relationship',
				'binding': function (o) {
					return o.RELATIONSHIPS.map((val) => val.RELATIONSHIP_NAME);
				},
				isArray: true,
			}, {
				'caption': 'Has Records',
				'binding': function (o) {
					return parseInt(o.RECORD_COUNT.toString()
						.replace(',', '')) > 0;
				}
			}, {
				'caption': 'Has Descendant Records',
				'binding': function (o) {
					return parseInt(o.DESCENDANT_RECORD_COUNT.toString()
						.replace(',', '')) > 0;
				}
			}, {
				'caption': 'Distance',
				'binding': function (o) {
					return Math.max.apply(Math, o.RELATIONSHIPS.map(function (d) {
						return d.RELATIONSHIP_DISTANCE;
					}))
				},
			}]
		};

		const getRelatedConceptsColumns = (sharedState) => [{
			title: '<i class="fa fa-shopping-cart"></i>',
			render: function (s, p, d) {
				var css = '';
				var icon = 'fa-shopping-cart';
				if (sharedState.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
					css = ' selected';
				}
				return '<i class="fa ' + icon + ' ' + css + '"></i>';
			},
			orderable: false,
			searchable: false
		}, {
			title: 'Id',
			data: 'CONCEPT_ID'
		}, {
			title: 'Code',
			data: 'CONCEPT_CODE'
		}, {
			title: 'Name',
			data: 'CONCEPT_NAME',
			render: function (s, p, d) {
				var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
				return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
			}
		}, {
			title: 'Class',
			data: 'CONCEPT_CLASS_ID'
		}, {
			title: 'Standard Concept Caption',
			data: 'STANDARD_CONCEPT_CAPTION',
			visible: false
		}, {
			title: 'RC',
			data: 'RECORD_COUNT',
			className: 'numeric'
		}, {
			title: 'DRC',
			data: 'DESCENDANT_RECORD_COUNT',
			className: 'numeric'
		}, {
			title: 'Domain',
			data: 'DOMAIN_ID'
		}, {
			title: 'Vocabulary',
			data: 'VOCABULARY_ID'
		}, {
			title: 'Ancestor',
			data: 'ANCESTORS'
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

		const metatrix = {
			'ATC.ATC 4th': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 5]
				}]
			},
			'ICD9CM.5-dig billing code': {
				childRelationships: [{
					name: 'Subsumes',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Is a',
					range: [0, 1]
				}]
			},
			'ICD9CM.4-dig nonbill code': {
				childRelationships: [{
					name: 'Subsumes',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Is a',
					range: [0, 1]
				}, {
					name: 'Non-standard to Standard map (OMOP)',
					range: [0, 1]
				}]
			},
			'ICD9CM.3-dig nonbill code': {
				childRelationships: [{
					name: 'Subsumes',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Non-standard to Standard map (OMOP)',
					range: [0, 999]
				}]
			},
			'RxNorm.Ingredient': {
				childRelationships: [{
					name: 'Ingredient of (RxNorm)',
					range: [0, 999]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					vocabulary: ['ATC', 'ETC'],
					range: [0, 1]
				}]
			},
			'RxNorm.Brand Name': {
				childRelationships: [{
					name: 'Ingredient of (RxNorm)',
					range: [0, 999]
				}],
				parentRelationships: [{
					name: 'Tradename of (RxNorm)',
					range: [0, 999]
				}]
			},
			'RxNorm.Branded Drug': {
				childRelationships: [{
					name: 'Consists of (RxNorm)',
					range: [0, 999]
				}],
				parentRelationships: [{
					name: 'Has ingredient (RxNorm)',
					range: [0, 999]
				}, {
					name: 'RxNorm to ATC (RxNorm)',
					range: [0, 999]
				}, {
					name: 'RxNorm to ETC (FDB)',
					range: [0, 999]
				}]
			},
			'RxNorm.Clinical Drug Comp': {
				childRelationships: [],
				parentRelationships: [{
					name: 'Has precise ingredient (RxNorm)',
					range: [0, 999]
				}, {
					name: 'Has ingredient (RxNorm)',
					range: [0, 999]
				}]
			},
			'CPT4.CPT4': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'CPT4.CPT4 Hierarchy': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'ETC.ETC': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'MedDRA.LLT': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'MedDRA.PT': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'MedDRA.HLT': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'MedDRA.SOC': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'MedDRA.HLGT': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'SNOMED.Clinical Finding': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'SNOMED.Procedure': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			}
		};

		const getRelatedSourcecodesColumns = (sharedState, context) => [{
			title: '',
			render: (s, p, d) => {
				var css = '';
				var icon = 'fa-shopping-cart';
				var tag = 'i'
				if (sharedState.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
					css = ' selected';
				}
				if (!context.canEditCurrentConceptSet()) {
					css += ' readonly';
					tag = 'span';
				}
				return '<' + tag + ' class="fa ' + icon + ' ' + css + '"></' + tag + '>';
			},
			orderable: false,
			searchable: false
		}, {
			title: 'Id',
			data: 'CONCEPT_ID'
		}, {
			title: 'Code',
			data: 'CONCEPT_CODE'
		}, {
			title: 'Name',
			data: 'CONCEPT_NAME',
			render: function (s, p, d) {
				var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
				return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
			}
		}, {
			title: 'Class',
			data: 'CONCEPT_CLASS_ID'
		}, {
			title: 'Standard Concept Caption',
			data: 'STANDARD_CONCEPT_CAPTION',
			visible: false
		}, {
			title: 'Domain',
			data: 'DOMAIN_ID'
		}, {
			title: 'Vocabulary',
			data: 'VOCABULARY_ID'
		}];

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
			RUNNING: 'RUNNING',
			COMPLETED: 'COMPLETED',
			FAILED: 'FAILED',
			PENDING: 'PENDING',
		};

		return {
			minChartHeight,
			treemapGradient,
			defaultDeciles,
			relatedConceptsOptions,
			getRelatedConceptsColumns,
			relatedSourcecodesOptions,
			metatrix,
			getRelatedSourcecodesColumns,
			apiPaths,
			applicationStatuses,
			generationStatuses,
			timeAtRiskCohortDate,
    };
  }
);