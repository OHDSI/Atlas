define(
  (require, factory) => {
		const ko = require('knockout');
		const sharedState = require('atlas-state');
    const config = require('appConfig');

		const minChartHeight = 300;
		const treemapGradient = ["#c7eaff", "#6E92A8", "#1F425A"];
		const defaultDeciles = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-99"];
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

		const getRelatedSourcecodesColumns = (context) => [{
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

		function ifCosts(ids) {
			return config.enableCosts ? ids : [];
		}

		var visualizationPacks = { // not implemented in the WebAPI results service
			careSite: {
				name: "Care Site",
				reportKey: null,
				analyses: [1200, 1201]
			},
			cohortSpecific: {
				name: "Cohort Specific",
				reportKey: 'Cohort Specific',
				analyses: [1700, 1800, 1801, 1802, 1803, 1804, 1805, 1806, 1807, 1808, 1809, 1810, 1811, 1812, 1813, 1814, 1815, 1816, 1820, 1821, 1830, 1831, 1840, 1841, 1850, 1851, 1860, 1861, 1870, 1871, 116, 117, 1]
			},
			condition: {
				name: "Condition",
				reportKey: 'Condition',
				analyses: [116, 117, 400, 401, 402, 404, 405, 406, 1]
			},
			conditionEras: {
				name: "Condition Eras",
				reportKey: 'Condition Eras',
				// analyses: [1001, 1000, 1007, 1006, 1004, 1002, 116, 117, 1]
				analyses: [1, 1000, 1007] // allows for quick analysis minimum requirements
			},
			conditionByIndex: {
				name: "Conditions by Index",
				reportKey: 'Conditions by Index',
				analyses: [1700, 1800, 1801, 1802, 1803, 1804, 1805, 1806, 1807, 1808, 1809, 1810, 1811, 1812, 1813, 1814, 1815, 1816, 1820, 1821, 1830, 1831, 1840, 1841, 1850, 1851, 1860, 1861, 1870, 1871, 116, 117, 1]
			}, // not implemented in cohort reporting
			dataDensity: {
				name: "Data Density",
				reportKey: null,
				analyses: [117, 220, 420, 502, 620, 720, 820, 920, 1020, 111, 403, 603, 703, 803, 903, 1003]
			},
			death: {
				name: "Death",
				reportKey: 'Death',
				analyses: [501, 506, 505, 504, 502, 116, 117]
			}, // required for all reports
			default: {
				name: "Default",
				reportKey: null,
				analyses: [1, 2, 101, 108, 110]
			},
			drugEras: {
				name: "Drug Eras",
				reportKey: 'Drug Eras',
				// analyses: [900, 901, 907, 906, 904, 902, 116, 117, 1]
				analyses: [1, 900, 907] // allows for quick analysis minimum requirements
			},
			drugExposure: {
				name: "Drug Exposure",
				reportKey: 'Drug Exposure',
				analyses: [700, 701, 706, 715, 705, 704, 116, 702, 117, 717, 716, 1]
			},
			drugsByIndex: {
				name: "Drugs by Index",
				reportKey: 'Drugs by Index',
				analyses: [1700, 1800, 1801, 1802, 1803, 1804, 1805, 1806, 1807, 1808, 1809, 1810, 1811, 1812, 1813, 1814, 1815, 1816, 1820, 1821, 1830, 1831, 1840, 1841, 1850, 1851, 1860, 1861, 1870, 1871, 116, 117, 1]
			},
			heraclesHeel: {
				name: "Heracles Heel",
				reportKey: null,
				analyses: [7, 8, 9, 114, 115, 207, 208, 209, 210, 302, 409, 410, 411, 412, 413, 509, 510, 609, 610, 612, 613, 709, 710, 711, 712, 713, 809, 810, 812, 813, 814, 908, 909, 910, 1008, 1009, 1010, 1415, 1500, 1501, 1600, 1601, 1701, 103, 105, 206, 406, 506, 606, 706, 715, 716, 717, 806, 906, 907, 1006, 1007, 1502, 1503, 1504, 1505, 1506, 1507, 1508, 1509, 1510, 1511, 1602, 1603, 1604, 1605, 1606, 1607, 1608, 511, 512, 513, 514, 515, 2, 4, 5, 200, 301, 400, 500, 505, 600, 700, 800, 900, 1000, 1609, 1610, 405, 605, 705, 805, 202, 3, 101, 420, 620, 720, 820, 920, 1020, 402, 602, 702, 802, 902, 1002, 1310, 1309, 1312, 1313, 1314]
			},
			location: {
				name: "Location",
				reportKey: null,
				analyses: [1100, 1101]
			}, // not implemented in the UI
			measurement: {
				name: "Measurement",
				reportKey: null,
				analyses: [1300, 1301, 1303, 1306, 1305, 1315, 1304, 1316, 1302, 1307, 1317, 1318, 1320, 117, 116, 1]
			}, // not implemented
			observation: {
				name: "Observation",
				reportKey: null,
				analyses: [800, 801, 806, 805, 815, 804, 802, 807, 816, 817, 818, 117, 116, 102, 112, 1]
			},
			observationPeriods: {
				name: "Observation Periods",
				reportKey: 'Observation Periods',
				analyses: [101, 104, 106, 107, 108, 109, 110, 113, 1]
			},
			person: {
				name: "Person",
				reportKey: 'Person',
				analyses: [0, 1, 2, 3, 4, 5]
			},
			procedure: {
				name: "Procedure",
				reportKey: 'Procedure',
				analyses: [606, 604, 116, 602, 117, 605, 600, 601, 1]
			},
			proceduresByIndex: {
				name: "Procedures by Index",
				reportKey: 'Procedures by Index',
				analyses: [1700, 1800, 1801, 1802, 1803, 1804, 1805, 1806, 1807, 1808, 1809, 1810, 1811, 1812, 1813, 1814, 1815, 1816, 1820, 1821, 1830, 1831, 1840, 1841, 1850, 1851, 1860, 1861, 1870, 1871, 116, 117, 1]
			}, // not implemented
			visit: {
				name: "Visit",
				reportKey: null,
				analyses: [202, 203, 206, 204, 116, 117, 211, 200, 201, 1]
			},
			dataCompleteness: {
				name: "Data Completeness",
				reportKey: "Data Completeness",
				analyses: [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2021, 2022, 2023, 2024, 2025, 2026, 2027]
			},
			entropy: {
				name: "Entropy",
				reportKey: "Entropy",
				analyses: [2031, 2032]
			},
			tornado: {
				name: "Tornado",
				reportKey: "Tornado",
				analyses: [3000, 3001]
			},
			healthcareUtilPersonAndExposureBaseline: {
				name: "Persons and Exposure during baseline period",
				reportKey: "Persons and Exposure during baseline period",
				analyses: [4000],
				helpContent: `
					<b>Baseline  period:</b> is the 365 days before the first cohort start date for each person not including cohort start date.<br/>
					<b>Person count:</b> number of unique subjects with person time exposure during the interval period.<br/>
					<b>Total Exposure in Years:</b> number of person years contributed by all subjects during the interval period.<br/>
					<b>Average Exposure Years per 1,000 persons:</b> (Total Exposure in Years/Person count)*1,000.<br/>
				`,
			},
			healthcareUtilPersonAndExposureCohort: {
				name: "Persons and Exposure during cohort period",
				reportKey: "Persons and Exposure during cohort period",
				analyses: [4006],
				helpContent: `
					<b>Cohort period:</b> is the interval between cohort start date and cohort end date for each subject including both dates.<br/>
					<b>Person count:</b> number of unique subjects with exposure during the interval period.<br/>
					<b>Total Exposure in Years:</b> number of years contributed by all subjects during the interval period.<br/>
					<b>Average Exposure Years per 1,000 persons:</b> (Total Exposure in Years/Person count)*1,000.<br/>
				`,
			},
			healthcareUtilVisitRecordsBaseline: {
				name: "Visits during baseline period",
				reportKey: "Visits during baseline period",
				analyses: [4000, 4001, 4002, 4005, ...ifCosts([4020])],
				helpContent: `
					<b>Baseline  period:</b> is the 365 days before the first cohort start date for each subject not including cohort start date.<br/>
					<b>Visit Record:</b> A visit record corresponds to visit_occurrence_id in visit_occurrence table.<br/>
					<b>Person Count:</b> number of unique persons with a visit record during the interval period.<br/>
					<b>Person Percent:</b> percent of persons with exposure who had a visit record in the interval period.<br/>
					<b>Total Records:</b> total number of records during the interval period.<br/>
					<b>Records per 1,000:</b> Total number of records per 1,000 subjects with exposure during the interval period.<br/>
					<b>Records per 1,000 with record:</b> Total number of visit records per 1,000 persons who have visit records during the interval period.<br/>
					<b>Records per 1,000 Per Year:</b> Total number of visit records per 1,000 person years during interval period.<br/>
					<b>Total length of stay (in days):</b> is the sum of duration of many single episodes of inpatient days are calculated by subtracting visit start date from visit end date. This information is only populated for inpatient visits.<br/>
					<b>Average Length of Stay (in days):</b> is the average of total length of stay per person. This information is only populated for inpatient visits.<br/>
				`,
			},
			healthcareUtilVisitDatesBaseline: {
				name: "Visit-dates during baseline period",
				reportKey: "Visit-dates during baseline period",
				analyses: [4000, 4001, 4003, 4005, ...ifCosts([4020])],
				helpContent: `
					<b>Baseline  period:</b> is the 365 days before the first cohort start date for each subject not including cohort start date.<br/>
					<b>Visit Record:</b> A visit record corresponds to unique combination person_id and visit_start_date in the visit_occurrence table.<br/>
					<b>Person Count:</b> number of unique persons with a visit record during the interval period.<br/>
					<b>Person Percent:</b> percent of persons with exposure who had a visit record in the interval period.<br/>
					<b>Total Records:</b> total number of records during the interval period.<br/>
					<b>Records per 1,000:</b> Total number of records per 1,000 subjects with exposure during the interval period.<br/>
					<b>Records per 1,000 with record:</b> Total number of visit records per 1,000 persons who have visit records during the interval period.<br/>
					<b>Records per 1,000 Per Year:</b> Total number of visit records per 1,000 person years during interval period.<br/>
					<b>Total length of stay (in days):</b> is the sum of duration of many single episodes of inpatient days are calculated by subtracting visit start date from visit end date. This information is only populated for inpatient visits.<br/>
					<b>Average Length of Stay (in days):</b> is the average of total length of stay per person. This information is only populated for inpatient visits.<br/>
				`,
			},
			healthcareUtilCareSiteDatesBaseline: {
				name: "Care-site-visit-dates during baseline period",
				reportKey: "Care-site-visit-dates during baseline period",
				analyses: [4000, 4001, 4004, 4005, ...ifCosts([4020])],
				helpContent: `
					<b>Baseline  period:</b> is the 365 days before the first cohort start date for each subject not including cohort start date.<br/>
					<b>Visit Record:</b> A visit record corresponds to unique combination person_id, care_site_id and visit_start_date in the visit_occurrence table.<br/>
					<b>Person Count:</b> number of unique persons with a visit record during the interval period.<br/>
					<b>Person Percent:</b> percent of persons with exposure who had a visit record in the interval period.<br/>
					<b>Total Records:</b> total number of records during the interval period.<br/>
					<b>Records per 1,000:</b> Total number of records per 1,000 subjects with exposure during the interval period.<br/>
					<b>Records per 1,000 with record:</b> Total number of visit records per 1,000 persons who have visit records during the interval period.<br/>
					<b>Records per 1,000 Per Year:</b> Total number of visit records per 1,000 person years during interval period.<br/>
					<b>Total length of stay (in days):</b> is the sum of duration of many single episodes of inpatient days are calculated by subtracting visit start date from visit end date. This information is only populated for inpatient visits.<br/>
					<b>Average Length of Stay (in days):</b> is the average of total length of stay per person. This information is only populated for inpatient visits.<br/>
				`
			},
			healthcareUtilVisitRecordsCohort: {
				name: "Visits during cohort period",
				reportKey: "Visits during cohort period",
				analyses: [4006, 4007, 4008, 4011, ...ifCosts([4021])],
				helpContent: `
					<b>Cohort period:</b> is the interval between cohort start date and cohort end date for each subject including both dates<br/>
					<b>Visit Record:</b> A visit record corresponds to visit_occurrence_id in visit_occurrence table.<br/>
					<b>Person Count:</b> number of unique persons with a visit record during the interval period.<br/>
					<b>Person Percent:</b> percent of persons with exposure who had a visit record in the interval period.<br/>
					<b>Total Records:</b> total number of records during the interval period.<br/>
					<b>Records per 1,000:</b> Total number of records per 1,000 subjects with exposure during the interval period.<br/>
					<b>Records per 1,000 with record:</b> Total number of visit records per 1,000 persons who have visit records during the interval period.<br/>
					<b>Records per 1,000 Per Year:</b> Total number of visit records per 1,000 person years during interval period.<br/>
					<b>Total length of stay (in days):</b> is the sum of duration of many single episodes of inpatient days are calculated by subtracting visit start date from visit end date. This information is only populated for inpatient visits.<br/>
					<b>Average Length of Stay (in days):</b> is the average of total length of stay per person. This information is only populated for inpatient visits.<br/>
				`
			},
			healthcareUtilVisitDatesCohort: {
				name: "Visit-dates during cohort period",
				reportKey: "Visit-dates during cohort period",
				analyses: [4006, 4007, 4009, 4011, ...ifCosts([4021])],
				helpContent: `
					<b>Cohort period:</b> is the interval between cohort start date and cohort end date for each subject including both dates.<br/>
					<b>Visit Record:</b> A visit record corresponds to unique combination person_id and visit_start_date in the visit_occurrence table.<br/>
					<b>Person Count:</b> number of unique persons with a visit record during the interval period.<br/>
					<b>Person Percent:</b> percent of persons with exposure who had a visit record in the interval period.<br/>
					<b>Total Records:</b> total number of records during the interval period.<br/>
					<b>Records per 1,000:</b> Total number of records per 1,000 subjects with exposure during the interval period.<br/>
					<b>Records per 1,000 with record:</b> Total number of visit records per 1,000 persons who have visit records during the interval period.<br/>
					<b>Records per 1,000 Per Year:</b> Total number of visit records per 1,000 person years during interval period.<br/>
					<b>Total length of stay (in days):</b> is the sum of duration of many single episodes of inpatient days are calculated by subtracting visit start date from visit end date. This information is only populated for inpatient visits.<br/>
					<b>Average Length of Stay (in days):</b> is the average of total length of stay per person. This information is only populated for inpatient visits.<br/>
				`,
			},
			healthcareUtilCareSiteDatesCohort: {
				name: "Care-site-visit-dates during cohort period",
				reportKey: "Care-site-visit-dates during cohort period",
				analyses: [4006, 4007, 4010, 4011, ...ifCosts([4021])],
				helpContent: `
					<b>Cohort period:</b> is the interval between cohort start date and cohort end date for each subject including both dates.<br/>
					<b>Visit Record:</b> A visit record corresponds to unique combination person_id, care_site_id and visit_start_date in the visit_occurrence table.<br/>
					<b>Person Count:</b> number of unique persons with a visit record during the interval period.<br/>
					<b>Person Percent:</b> percent of persons with exposure who had a visit record in the interval period.<br/>
					<b>Total Records:</b> total number of records during the interval period.<br/>
					<b>Records per 1,000:</b> Total number of records per 1,000 subjects with exposure during the interval period.<br/>
					<b>Records per 1,000 with record:</b> Total number of visit records per 1,000 persons who have visit records during the interval period.<br/>
					<b>Records per 1,000 Per Year:</b> Total number of visit records per 1,000 person years during interval period.<br/>
					<b>Total length of stay (in days):</b> is the sum of duration of many single episodes of inpatient days are calculated by subtracting visit start date from visit end date. This information is only populated for inpatient visits.<br/>
					<b>Average Length of Stay (in days):</b> is the average of total length of stay per person. This information is only populated for inpatient visits.<br/>
				`,
			},
			healthcareUtilDrugBaseline: {
				name: "Drug Utilization during baseline period",
				reportKey: "Drug Utilization during baseline period",
				analyses: [4000, 4012, 4013, 4014, 4015, ...ifCosts([4022])],
				helpContent: `
					<b>Baseline  period:</b> is the 365 days before the first cohort start date for each subject not including cohort start date.<br/>
					<b>Person count:</b> number of unique persons with a drug exposure record during the interval period.<br/>
					<b>Record:</b> corresponds to drug_exposure_id in drug_exposure table.<br/>
					<b>Total records:</b> total number of records during the interval period.<br/>
					<b>Records per 1,000:</b> Total number of records per 1,000 subjects with exposure during the interval period.<br/>
					<b>Records per 1,000 with records:</b> Total number of visit records per 1,000 persons who have visit records during the interval period.<br/>
					<b>Total Day Supply (in Days):</b> is the sum of day supply of drug_exposure records calculated by adding the values in the field days_supply<br/>
					<b>Average Day Supply (in Days):</b> is the average of day supply of drug_exposure records calculated by adding the values in the field days_supply<br/>
				`,
			},
			healthcareUtilDrugCohort: {
				name: "Drug Utilization during cohort period",
				reportKey: "Drug Utilization during cohort period",
				analyses: [4006, 4016, 4017, 4018, 4019, ...ifCosts([4023])],
				helpContent: `
				`
			},
		};

		const apiPaths = {
			users: () => `${config.api.url}user`,
			role: (id = '') => `${config.api.url}role/${id}`,
      roleUsers: roleId => `${config.api.url}role/${roleId}/users`,
      permissions: () => `${config.api.url}permission`,
      rolePermissions: roleId => `${config.api.url}role/${roleId}/permissions`,
      relations: (roleId, relation, ids = []) => `${config.api.url}role/${roleId}/${relation}/${ids.join('+')}`,
			jobs: () => `${config.api.url}job/execution?comprehensivePage=true`,
			cohortDefinition: () => `${config.api.url}cohortdefinition`,
			cohortResults: (source, cohortId) => `${config.api.url}cohortresults/${source}/${cohortId}`,
			execution: () => `${config.api.url}executionservice`,
			ir: () => `${config.api.url}ir`,
			plp: () => `${config.api.url}plp`,
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
			visualizationPacks,
    };
  }
);