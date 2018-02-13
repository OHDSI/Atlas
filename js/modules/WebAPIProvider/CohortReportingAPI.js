define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var ko = require('knockout');

	var visualizationPacks = [ // not implemented in the WebAPI results service
		{
			name: "Care Site",
			reportKey: null,
			analyses: [1200, 1201]
		}, {
			name: "Cohort Specific",
			reportKey: 'Cohort Specific',
			analyses: [1700, 1800, 1801, 1802, 1803, 1804, 1805, 1806, 1807, 1808, 1809, 1810, 1811, 1812, 1813, 1814, 1815, 1816, 1820, 1821, 1830, 1831, 1840, 1841, 1850, 1851, 1860, 1861, 1870, 1871, 116, 117, 1]
		}, {
			name: "Condition",
			reportKey: 'Condition',
			analyses: [116, 117, 400, 401, 402, 404, 405, 406, 1]
		}, {
			name: "Condition Eras",
			reportKey: 'Condition Eras',
			// analyses: [1001, 1000, 1007, 1006, 1004, 1002, 116, 117, 1]
			analyses: [1, 1000, 1007] // allows for quick analysis minimum requirements
		}, {
			name: "Conditions by Index",
			reportKey: 'Conditions by Index',
			analyses: [1700, 1800, 1801, 1802, 1803, 1804, 1805, 1806, 1807, 1808, 1809, 1810, 1811, 1812, 1813, 1814, 1815, 1816, 1820, 1821, 1830, 1831, 1840, 1841, 1850, 1851, 1860, 1861, 1870, 1871, 116, 117, 1]
		}, // not implemented in cohort reporting
		{
			name: "Data Density",
			reportKey: null,
			analyses: [117, 220, 420, 502, 620, 720, 820, 920, 1020, 111, 403, 603, 703, 803, 903, 1003]
		}, {
			name: "Death",
			reportKey: 'Death',
			analyses: [501, 506, 505, 504, 502, 116, 117]
		}, // required for all reports
		{
			name: "Default",
			reportKey: null,
			analyses: [1, 2, 101, 108, 110]
		}, {
			name: "Drug Eras",
			reportKey: 'Drug Eras',
			// analyses: [900, 901, 907, 906, 904, 902, 116, 117, 1]
			analyses: [1, 900, 907] // allows for quick analysis minimum requirements
		}, {
			name: "Drug Exposure",
			reportKey: 'Drug Exposure',
			analyses: [700, 701, 706, 715, 705, 704, 116, 702, 117, 717, 716, 1]
		}, {
			name: "Drugs by Index",
			reportKey: 'Drugs by Index',
			analyses: [1700, 1800, 1801, 1802, 1803, 1804, 1805, 1806, 1807, 1808, 1809, 1810, 1811, 1812, 1813, 1814, 1815, 1816, 1820, 1821, 1830, 1831, 1840, 1841, 1850, 1851, 1860, 1861, 1870, 1871, 116, 117, 1]
		},
		{
			name: "Heracles Heel",
			reportKey: null,
			analyses: [7, 8, 9, 114, 115, 207, 208, 209, 210, 302, 409, 410, 411, 412, 413, 509, 510, 609, 610, 612, 613, 709, 710, 711, 712, 713, 809, 810, 812, 813, 814, 908, 909, 910, 1008, 1009, 1010, 1415, 1500, 1501, 1600, 1601, 1701, 103, 105, 206, 406, 506, 606, 706, 715, 716, 717, 806, 906, 907, 1006, 1007, 1502, 1503, 1504, 1505, 1506, 1507, 1508, 1509, 1510, 1511, 1602, 1603, 1604, 1605, 1606, 1607, 1608, 511, 512, 513, 514, 515, 2, 4, 5, 200, 301, 400, 500, 505, 600, 700, 800, 900, 1000, 1609, 1610, 405, 605, 705, 805, 202, 3, 101, 420, 620, 720, 820, 920, 1020, 402, 602, 702, 802, 902, 1002, 1310, 1309, 1312, 1313, 1314]
		},
		{
			name: "Location",
			reportKey: null,
			analyses: [1100, 1101]
		}, // not implemented in the UI
		{
			name: "Measurement",
			reportKey: null,
			analyses: [1300, 1301, 1303, 1306, 1305, 1315, 1304, 1316, 1302, 1307, 1317, 1318, 1320, 117, 116, 1]
		}, // not implemented
		{
			name: "Observation",
			reportKey: null,
			analyses: [800, 801, 806, 805, 815, 804, 802, 807, 816, 817, 818, 117, 116, 102, 112, 1]
		}, {
			name: "Observation Periods",
			reportKey: 'Observation Periods',
			analyses: [101, 104, 106, 107, 108, 109, 110, 113, 1]
		}, {
			name: "Person",
			reportKey: 'Person',
			analyses: [0, 1, 2, 3, 4, 5]
		}, {
			name: "Procedure",
			reportKey: 'Procedure',
			analyses: [606, 604, 116, 602, 117, 605, 600, 601, 1]
		}, {
			name: "Procedures by Index",
			reportKey: 'Procedures by Index',
			analyses: [1700, 1800, 1801, 1802, 1803, 1804, 1805, 1806, 1807, 1808, 1809, 1810, 1811, 1812, 1813, 1814, 1815, 1816, 1820, 1821, 1830, 1831, 1840, 1841, 1850, 1851, 1860, 1861, 1870, 1871, 116, 117, 1]
		}, // not implemented
		{
			name: "Visit",
			reportKey: null,
			analyses: [202, 203, 206, 204, 116, 117, 211, 200, 201, 1]
		}, {
			name: "Data Completeness",
			reportKey: "Data Completeness",
			analyses: [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2021, 2022, 2023, 2024, 2025, 2026, 2027]
		}, {
			name: "Entropy",
			reportKey: "Entropy",
			analyses: [2031, 2032]
		}, {
			name: "Tornado",
			reportKey: "Tornado",
			analyses: [3000, 3001]
		}
	];

	function getAnalysisIdentifiers() {
		var identifiers = [];
		visualizationPacks.forEach(v => {
			v.analyses.forEach(a => {
				identifiers.push(a);
			});
		});
		return identifiers;
	}

	function getQuickAnalysisIdentifiers() {
		return [0, 1, 2, 3, 4, 5, 900, 907, 1000, 1007, 3000, 3001];
	}

	function getAvailableReports(completedAnalyses) {
		var reports = [];
		if (completedAnalyses.length == 0) {
			return reports;
		}

		visualizationPacks.forEach(vp => {
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
		getCompletedAnalyses: getCompletedAnalyses,
		getCompletedHeraclesHeelAnalyses: getCompletedHeraclesHeelAnalyses,
		getAvailableReports: getAvailableReports,
		getAnalysisIdentifiers: getAnalysisIdentifiers,
		getQuickAnalysisIdentifiers: getQuickAnalysisIdentifiers
	}

	return api;
});
