define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var ko = require('knockout');

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
      analyses: [1, 1000, 1002, 1004, 1006, 1007] // allows for quick analysis minimum requirements
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
      analyses: [1, 900, 902, 904, 906, 907] // allows for quick analysis minimum requirements
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
      name: ko.i18n('options.reporting.personsAndExposureDuringBaselinePeriod', 'Persons and Exposure during baseline period'),
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
      name: ko.i18n('options.reporting.personsAndExposureDuringCohortPeriod', 'Persons and Exposure during cohort period'),
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
      name: ko.i18n('options.reporting.visitsDuringBaselinePeriod', 'Visits during baseline period'),
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
      name: ko.i18n('options.reporting.visitDatesDuringBaselinePeriod', 'Visit-dates during baseline period'),
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
      name: ko.i18n('options.reporting.careSiteVisitDatesDuringBaselinePeriod', 'Care-site-visit-dates during baseline period'),
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
      name: ko.i18n('options.reporting.visitsDuringCohortPeriod', 'Visits during cohort period'),
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
      name: ko.i18n('options.reporting.visitDatesDuringCohortPeriod', 'Visit-dates during cohort period'),
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
      name: ko.i18n('options.reporting.careSiteVisitDatesDuringCohortPeriod', 'Care-site-visit-dates during cohort period'),
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
      name: ko.i18n('options.reporting.drugUtilizationDuringBaselinePeriod', 'Drug Utilization during baseline period'),
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
      name: ko.i18n('options.reporting.drugUtilizationDuringCohortPeriod', 'Drug Utilization during cohort period'),
      reportKey: "Drug Utilization during cohort period",
      analyses: [4006, 4016, 4017, 4018, 4019, ...ifCosts([4023])],
      helpContent: `
      `
    },
  };

	function ifCosts(ids) {
	  return config.enableCosts ? ids : [];
  }

	function getAnalysisIdentifiers() {
		var identifiers = [];
		Object.values(visualizationPacks).forEach(v => {
			v.analyses.forEach(a => {
				identifiers.push(a);
			});
		});
		return identifiers;
	}

	function getQuickAnalysisIdentifiers() {
		return visualizationPacks.default.analyses
			.concat(visualizationPacks.person.analyses)
			.concat(visualizationPacks.conditionEras.analyses)
			.concat(visualizationPacks.drugEras.analyses)
			.concat(visualizationPacks.procedure.analyses)
			.concat(visualizationPacks.tornado.analyses)
			.filter((d,i, arr) => arr.indexOf(d) == i);
	}

  function getHealthcareAnalysesIdentifiers() {
    return getAnalysisIdentifiers().filter(id => id >= 4000 && id < 4100);
  }

	function getAvailableReports(completedAnalyses) {
		var reports = [];
		if (completedAnalyses.length == 0) {
			return reports;
		}

		Object.values(visualizationPacks).forEach(vp => {
			if (vp.reportKey == null) {
				// null report keys won't be listed as available reports
				// but we keep them as their analysis identifiers are still necessary
				// for the analysis to complete
				return;
			}
			var analysisMissing = false;
			vp.analyses.forEach(a => {
				if (completedAnalyses.indexOf(a) == -1) {
					analysisMissing = true;
				};
			});
			if (!analysisMissing) {
				reports.push(vp);
			}
		});
		return reports;
	}
	
	function getCompletedAnalyses(source, cohortDefinitionId) {
		var promise = $.ajax(config.api.url + 'cohortresults/' + source.sourceKey + '/' + cohortDefinitionId + '/analyses');
		return promise;
	}

	function getCompletedHeraclesHeelAnalyses(source, cohortDefinitionId) {
		var promise = $.ajax(config.api.url + 'cohortresults/' + source.sourceKey + '/' + cohortDefinitionId + '/heraclesheel?refresh=true');
		return promise;
	}

	var api = {
		getCompletedAnalyses,
		getCompletedHeraclesHeelAnalyses,
		getAvailableReports,
		getAnalysisIdentifiers,
		getQuickAnalysisIdentifiers,
    getHealthcareAnalysesIdentifiers,
    visualizationPacks,
	};

	return api;
});
