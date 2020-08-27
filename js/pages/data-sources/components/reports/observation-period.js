define([
    "knockout",
    "text!./observation-period.html",
    "d3",
    "atlascharts",
    "utils/CommonUtils",
    "utils/ChartUtils",
    "const",
    "pages/data-sources/classes/Report",
    "components/Component",
    "components/charts/histogram",
    "components/charts/boxplot",
    "components/charts/line",
    // 'components/charts/donut',
    // 'components/charts/trellisline',
    // 'components/charts/histogram',
    // 'components/charts/frequencyHistogram',
    // 'components/heading',
    // 'components/empty-state',
], function (ko, view, d3, atlascharts, commonUtils, ChartUtils, constants, Report, Component) {
    class ObservationPeriodReport extends Report {
        constructor(params) {
            super(params);

            // plots
            this.ageAtFirstObservationData = ko.observable();
            this.ageByGenderData = ko.observable();
            this.observationLengthData = ko.observable();
            this.durationByGenderData = ko.observable();
            this.cumulativeObservationData = ko.observable();
            this.durationByAgeDecileData = ko.observable();
            this.personsWithContinuousObservationByYearData = ko.observable();
            this.observationPeriodsPerPersonData = ko.observable();
            this.personsWithContinuousObservationByMonthData = ko.observable();

            this.isError = ko.observable(false);

            this.chartFormats = {
                ageAtFirstObservation: {
                    xLabel: "Age",
                    yLabel: "People",
                    xFormat: d3.format("d"),
                    yFormat: d3.format(",.1s"),
                },
                ageByGender: {
                    yLabel: "Age",
                    xLabel: "Gender",
                    yFormat: d3.format(",.1s"),
                    valueFormatter: d3.format("d"),
                },
                observationLength: {
                    xLabel: "Days",
                    yLabel: "People",
                    xFormat: d3.format("d"),
                    yFormat: d3.format(",.1s"),
                },
                durationByGender: {
                    yLabel: "Days",
                    xLabel: "Gender",
                    yFormat: d3.format(",.1s"),
                    valueFormatter: d3.format("d"),
				},
				cumulativeObservation: {
					yFormat: d3.format('0.0%'),
					xFormat: (d) => {
						if (d < 10) {
							return d3.format('.2n')(d)
						} else {
							return d3.format('d')(d)
						}
					},
					interpolate: (new atlascharts.line()).interpolation.curveStepBefore,
					xLabel: 'Days',
					yLabel: 'Percent of Population'
				}
            };

            // this.loadData();

            // WIP
            // MOCK DATA
            this.res = {
                ageAtFirst: [
                    { intervalIndex: 26, percentValue: 0.00347, countValue: 7 },
                    { intervalIndex: 33, percentValue: 0.00298, countValue: 6 },
                    {
                        intervalIndex: 35,
                        percentValue: 0.00546,
                        countValue: 11,
                    },
                    {
                        intervalIndex: 36,
                        percentValue: 0.00645,
                        countValue: 13,
                    },
                    { intervalIndex: 37, percentValue: 0.00347, countValue: 7 },
                    { intervalIndex: 38, percentValue: 0.00397, countValue: 8 },
                    { intervalIndex: 40, percentValue: 0.00298, countValue: 6 },
                    { intervalIndex: 41, percentValue: 0.00397, countValue: 8 },
                    { intervalIndex: 42, percentValue: 0.00397, countValue: 8 },
                    {
                        intervalIndex: 43,
                        percentValue: 0.00496,
                        countValue: 10,
                    },
                    {
                        intervalIndex: 45,
                        percentValue: 0.00496,
                        countValue: 10,
                    },
                    {
                        intervalIndex: 46,
                        percentValue: 0.00844,
                        countValue: 17,
                    },
                    { intervalIndex: 47, percentValue: 0.00397, countValue: 8 },
                    {
                        intervalIndex: 48,
                        percentValue: 0.00596,
                        countValue: 12,
                    },
                    {
                        intervalIndex: 49,
                        percentValue: 0.00596,
                        countValue: 12,
                    },
                    { intervalIndex: 50, percentValue: 0.00298, countValue: 6 },
                    {
                        intervalIndex: 51,
                        percentValue: 0.00546,
                        countValue: 11,
                    },
                    {
                        intervalIndex: 52,
                        percentValue: 0.00645,
                        countValue: 13,
                    },
                    {
                        intervalIndex: 53,
                        percentValue: 0.00645,
                        countValue: 13,
                    },
                    {
                        intervalIndex: 55,
                        percentValue: 0.00844,
                        countValue: 17,
                    },
                    {
                        intervalIndex: 56,
                        percentValue: 0.00546,
                        countValue: 11,
                    },
                    {
                        intervalIndex: 57,
                        percentValue: 0.01042,
                        countValue: 21,
                    },
                    {
                        intervalIndex: 58,
                        percentValue: 0.00546,
                        countValue: 11,
                    },
                    {
                        intervalIndex: 59,
                        percentValue: 0.00893,
                        countValue: 18,
                    },
                    {
                        intervalIndex: 60,
                        percentValue: 0.00893,
                        countValue: 18,
                    },
                    {
                        intervalIndex: 61,
                        percentValue: 0.00943,
                        countValue: 19,
                    },
                    {
                        intervalIndex: 62,
                        percentValue: 0.01092,
                        countValue: 22,
                    },
                    {
                        intervalIndex: 63,
                        percentValue: 0.00943,
                        countValue: 19,
                    },
                    {
                        intervalIndex: 64,
                        percentValue: 0.00794,
                        countValue: 16,
                    },
                    {
                        intervalIndex: 65,
                        percentValue: 0.04715,
                        countValue: 95,
                    },
                    {
                        intervalIndex: 66,
                        percentValue: 0.03821,
                        countValue: 77,
                    },
                    {
                        intervalIndex: 67,
                        percentValue: 0.03325,
                        countValue: 67,
                    },
                    {
                        intervalIndex: 68,
                        percentValue: 0.03672,
                        countValue: 74,
                    },
                    { intervalIndex: 69, percentValue: 0.0397, countValue: 80 },
                    {
                        intervalIndex: 70,
                        percentValue: 0.03821,
                        countValue: 77,
                    },
                    { intervalIndex: 71, percentValue: 0.0397, countValue: 80 },
                    {
                        intervalIndex: 72,
                        percentValue: 0.03722,
                        countValue: 75,
                    },
                    {
                        intervalIndex: 73,
                        percentValue: 0.03871,
                        countValue: 78,
                    },
                    {
                        intervalIndex: 74,
                        percentValue: 0.03474,
                        countValue: 70,
                    },
                    {
                        intervalIndex: 75,
                        percentValue: 0.03375,
                        countValue: 68,
                    },
                    {
                        intervalIndex: 76,
                        percentValue: 0.03226,
                        countValue: 65,
                    },
                    {
                        intervalIndex: 77,
                        percentValue: 0.02829,
                        countValue: 57,
                    },
                    {
                        intervalIndex: 78,
                        percentValue: 0.03275,
                        countValue: 66,
                    },
                    {
                        intervalIndex: 79,
                        percentValue: 0.03226,
                        countValue: 65,
                    },
                    {
                        intervalIndex: 80,
                        percentValue: 0.02779,
                        countValue: 56,
                    },
                    {
                        intervalIndex: 81,
                        percentValue: 0.02382,
                        countValue: 48,
                    },
                    {
                        intervalIndex: 82,
                        percentValue: 0.02878,
                        countValue: 58,
                    },
                    {
                        intervalIndex: 83,
                        percentValue: 0.02382,
                        countValue: 48,
                    },
                    {
                        intervalIndex: 84,
                        percentValue: 0.02184,
                        countValue: 44,
                    },
                    {
                        intervalIndex: 85,
                        percentValue: 0.01538,
                        countValue: 31,
                    },
                    {
                        intervalIndex: 86,
                        percentValue: 0.01489,
                        countValue: 30,
                    },
                    {
                        intervalIndex: 87,
                        percentValue: 0.01538,
                        countValue: 31,
                    },
                    {
                        intervalIndex: 88,
                        percentValue: 0.01836,
                        countValue: 37,
                    },
                    {
                        intervalIndex: 89,
                        percentValue: 0.01985,
                        countValue: 40,
                    },
                    {
                        intervalIndex: 90,
                        percentValue: 0.00844,
                        countValue: 17,
                    },
                    {
                        intervalIndex: 91,
                        percentValue: 0.00546,
                        countValue: 11,
                    },
                    { intervalIndex: 92, percentValue: 0.00397, countValue: 8 },
                    { intervalIndex: 93, percentValue: 0.00397, countValue: 8 },
                    { intervalIndex: 94, percentValue: 0.00397, countValue: 8 },
                    { intervalIndex: 95, percentValue: 0.00397, countValue: 8 },
                    {
                        intervalIndex: 96,
                        percentValue: 0.00496,
                        countValue: 10,
                    },
                    {
                        intervalIndex: 97,
                        percentValue: 0.00645,
                        countValue: 13,
                    },
                    { intervalIndex: 98, percentValue: 0.00447, countValue: 9 },
                    {
                        intervalIndex: 99,
                        percentValue: 0.00496,
                        countValue: 10,
                    },
                ],
                observationLength: [
                    { intervalIndex: 24, percentValue: 0.00298, countValue: 6 },
                    { intervalIndex: 25, percentValue: 0.00397, countValue: 8 },
                    {
                        intervalIndex: 26,
                        percentValue: 0.01538,
                        countValue: 31,
                    },
                    {
                        intervalIndex: 27,
                        percentValue: 0.02432,
                        countValue: 49,
                    },
                    {
                        intervalIndex: 28,
                        percentValue: 0.03424,
                        countValue: 69,
                    },
                    {
                        intervalIndex: 29,
                        percentValue: 0.05161,
                        countValue: 104,
                    },
                    { intervalIndex: 30, percentValue: 0.067, countValue: 135 },
                    {
                        intervalIndex: 31,
                        percentValue: 0.09429,
                        countValue: 190,
                    },
                    {
                        intervalIndex: 32,
                        percentValue: 0.12655,
                        countValue: 255,
                    },
                    {
                        intervalIndex: 33,
                        percentValue: 0.15881,
                        countValue: 320,
                    },
                    {
                        intervalIndex: 34,
                        percentValue: 0.16427,
                        countValue: 331,
                    },
                    {
                        intervalIndex: 35,
                        percentValue: 0.17965,
                        countValue: 362,
                    },
                    {
                        intervalIndex: 36,
                        percentValue: 0.06501,
                        countValue: 131,
                    },
                ],
                personsWithContinuousObservationsByYear: [
                    { intervalIndex: 0, percentValue: 0.01886, countValue: 38 },
                    {
                        intervalIndex: 1,
                        percentValue: 0.99256,
                        countValue: 2000,
                    },
                    { intervalIndex: 2, percentValue: 0.03573, countValue: 72 },
                ],
                personsWithContinuousObservationsByYearStats: [{ minValue: 2008, maxValue: 2010, intervalSize: 1 }],
                observationLengthStats: [{ minValue: 720, maxValue: 1080, intervalSize: 30 }],
                ageByGender: [
                    {
                        category: "MALE",
                        conceptId: 0,
                        p10Value: 49,
                        p25Value: 65,
                        p75Value: 78,
                        p90Value: 85,
                        minValue: 25,
                        medianValue: 71,
                        maxValue: 99,
                    },
                    {
                        category: "FEMALE",
                        conceptId: 0,
                        p10Value: 55,
                        p25Value: 66,
                        p75Value: 81,
                        p90Value: 87,
                        minValue: 25,
                        medianValue: 73,
                        maxValue: 99,
                    },
                ],
                durationByGender: [
                    {
                        category: "MALE",
                        conceptId: 0,
                        p10Value: 874,
                        p25Value: 945,
                        p75Value: 1049,
                        p90Value: 1075,
                        minValue: 232,
                        medianValue: 1003,
                        maxValue: 1107,
                    },
                    {
                        category: "FEMALE",
                        conceptId: 0,
                        p10Value: 871,
                        p25Value: 941,
                        p75Value: 1048,
                        p90Value: 1074,
                        minValue: 277,
                        medianValue: 1003,
                        maxValue: 1103,
                    },
                ],
                durationByAgeDecile: [
                    {
                        category: "20-29",
                        conceptId: 0,
                        p10Value: 827,
                        p25Value: 957,
                        p75Value: 1038,
                        p90Value: 1054,
                        minValue: 544,
                        medianValue: 993,
                        maxValue: 1091,
                    },
                    {
                        category: "30-39",
                        conceptId: 0,
                        p10Value: 852,
                        p25Value: 932,
                        p75Value: 1054,
                        p90Value: 1082,
                        minValue: 691,
                        medianValue: 1016,
                        maxValue: 1090,
                    },
                    {
                        category: "40-49",
                        conceptId: 0,
                        p10Value: 863,
                        p25Value: 914,
                        p75Value: 1060,
                        p90Value: 1077,
                        minValue: 773,
                        medianValue: 1012,
                        maxValue: 1103,
                    },
                    {
                        category: "50-59",
                        conceptId: 0,
                        p10Value: 882,
                        p25Value: 940,
                        p75Value: 1038,
                        p90Value: 1075,
                        minValue: 446,
                        medianValue: 987,
                        maxValue: 1107,
                    },
                    {
                        category: "60-69",
                        conceptId: 0,
                        p10Value: 868,
                        p25Value: 946,
                        p75Value: 1049,
                        p90Value: 1071,
                        minValue: 232,
                        medianValue: 1001,
                        maxValue: 1092,
                    },
                    {
                        category: "70-79",
                        conceptId: 0,
                        p10Value: 885,
                        p25Value: 945,
                        p75Value: 1047,
                        p90Value: 1075,
                        minValue: 474,
                        medianValue: 1003,
                        maxValue: 1093,
                    },
                    {
                        category: "80-89",
                        conceptId: 0,
                        p10Value: 870,
                        p25Value: 945,
                        p75Value: 1050,
                        p90Value: 1075,
                        minValue: 421,
                        medianValue: 1005,
                        maxValue: 1102,
                    },
                    {
                        category: "90-99",
                        conceptId: 0,
                        p10Value: 878,
                        p25Value: 924,
                        p75Value: 1046,
                        p90Value: 1069,
                        minValue: 790,
                        medianValue: 1002,
                        maxValue: 1089,
                    },
                ],
                cumulativeObservation: [
                    {
                        seriesName: "Length of observation",
                        xLengthOfObservation: 720,
                        yPercentPersons: 0.98809,
                    },
                    {
                        seriesName: "Length of observation",
                        xLengthOfObservation: 750,
                        yPercentPersons: 0.98511,
                    },
                    {
                        seriesName: "Length of observation",
                        xLengthOfObservation: 780,
                        yPercentPersons: 0.98114,
                    },
                    {
                        seriesName: "Length of observation",
                        xLengthOfObservation: 810,
                        yPercentPersons: 0.96576,
                    },
                    {
                        seriesName: "Length of observation",
                        xLengthOfObservation: 840,
                        yPercentPersons: 0.94144,
                    },
                    {
                        seriesName: "Length of observation",
                        xLengthOfObservation: 870,
                        yPercentPersons: 0.9072,
                    },
                    {
                        seriesName: "Length of observation",
                        xLengthOfObservation: 900,
                        yPercentPersons: 0.85558,
                    },
                    {
                        seriesName: "Length of observation",
                        xLengthOfObservation: 930,
                        yPercentPersons: 0.78859,
                    },
                    {
                        seriesName: "Length of observation",
                        xLengthOfObservation: 960,
                        yPercentPersons: 0.69429,
                    },
                    {
                        seriesName: "Length of observation",
                        xLengthOfObservation: 990,
                        yPercentPersons: 0.56774,
                    },
                    {
                        seriesName: "Length of observation",
                        xLengthOfObservation: 1020,
                        yPercentPersons: 0.40893,
                    },
                    {
                        seriesName: "Length of observation",
                        xLengthOfObservation: 1050,
                        yPercentPersons: 0.24467,
                    },
                    {
                        seriesName: "Length of observation",
                        xLengthOfObservation: 1080,
                        yPercentPersons: 0.06501,
                    },
                ],
                observationPeriodsPerPerson: [
                    {
                        conditionConceptName: null,
                        conditionConceptId: 0,
                        observationConceptName: null,
                        observationConceptId: 0,
                        conceptName: "1",
                        conceptId: 1,
                        countValue: 2015,
                    },
                ],
                observedByMonth: [
                    {
                        monthYear: 200801,
                        percentValue: 0.01886,
                        countValue: 38,
                    },
                    {
                        monthYear: 200802,
                        percentValue: 0.55931,
                        countValue: 1127,
                    },
                    {
                        monthYear: 200803,
                        percentValue: 0.74194,
                        countValue: 1495,
                    },
                    {
                        monthYear: 200804,
                        percentValue: 0.90422,
                        countValue: 1822,
                    },
                    {
                        monthYear: 200805,
                        percentValue: 0.95732,
                        countValue: 1929,
                    },
                    {
                        monthYear: 200806,
                        percentValue: 0.9737,
                        countValue: 1962,
                    },
                    {
                        monthYear: 200807,
                        percentValue: 0.97816,
                        countValue: 1971,
                    },
                    {
                        monthYear: 200808,
                        percentValue: 0.98263,
                        countValue: 1980,
                    },
                    {
                        monthYear: 200809,
                        percentValue: 0.9866,
                        countValue: 1988,
                    },
                    {
                        monthYear: 200810,
                        percentValue: 0.98759,
                        countValue: 1990,
                    },
                    {
                        monthYear: 200811,
                        percentValue: 0.99057,
                        countValue: 1996,
                    },
                    {
                        monthYear: 200812,
                        percentValue: 0.99057,
                        countValue: 1996,
                    },
                    {
                        monthYear: 200901,
                        percentValue: 0.99256,
                        countValue: 2000,
                    },
                    {
                        monthYear: 200902,
                        percentValue: 0.99256,
                        countValue: 2000,
                    },
                    {
                        monthYear: 200903,
                        percentValue: 0.99305,
                        countValue: 2001,
                    },
                    {
                        monthYear: 200904,
                        percentValue: 0.99504,
                        countValue: 2005,
                    },
                    {
                        monthYear: 200906,
                        percentValue: 0.99553,
                        countValue: 2006,
                    },
                    {
                        monthYear: 200907,
                        percentValue: 0.99603,
                        countValue: 2007,
                    },
                    {
                        monthYear: 200908,
                        percentValue: 0.99702,
                        countValue: 2009,
                    },
                    {
                        monthYear: 200909,
                        percentValue: 0.99801,
                        countValue: 2011,
                    },
                    {
                        monthYear: 200911,
                        percentValue: 0.99851,
                        countValue: 2012,
                    },
                    {
                        monthYear: 201002,
                        percentValue: 0.9995,
                        countValue: 2014,
                    },
                ],
            };

            this.parseData({ data: this.res });
        }

        parseData({ data }) {
            this.parseAgeAtFirstObservation(data.ageAtFirst);
            this.parseAgeByGender(data.ageByGender);
            this.parseObservationLength(data.observationLength, data.observationLengthStats);
            this.parseDurationByGender(data.durationByGender);
            this.parseCumulativeObservation(data.cumulativeObservation);
            // this.durationByAgeDecile(data.durationByAgeDecile);
            // this.personsWithContinuousObservationByYear(data.personsWithContinuousObservationsByYear, data.personsWithContinuousObservationsByYearStats);
            // this.observationPeriodsPerPerson(data.observationPeriodsPerPerson);
            // this.personsWithContinuousObservationByMonth(data.observedByMonth);
        }

        parseAgeAtFirstObservation(data) {
            if (!data.empty) {
                const histData = {};
                let ageAtFirstDataMapped = data.map((value) => ({
                    INTERVAL_INDEX: value.intervalIndex,
                    COUNT_VALUE: value.countValue,
                }));
                histData.INTERVAL_SIZE = 1;
                histData.OFFSET = 0;
                histData.DATA = ChartUtils.normalizeArray(ageAtFirstDataMapped);
                histData.INTERVALS = histData.DATA.INTERVAL_INDEX.length;
                this.ageAtFirstObservationData(atlascharts.histogram.mapHistogram(histData));
            }
        }

        parseAgeByGender(data) {
            const bpseries = this.parseBoxPlotData(data);
            this.ageByGenderData(bpseries);
        }

        parseObservationLength(observationLength, [observationLengthStats]) {
            if (observationLength && observationLength.length > 0 && observationLengthStats) {
                const histData = {};
                let observationDataMapped = observationLength.map((value) => ({
                    INTERVAL_INDEX: value.intervalIndex,
                    COUNT_VALUE: value.countValue,
                }));
                histData.DATA = ChartUtils.normalizeArray(observationDataMapped);
                histData.INTERVAL_SIZE = observationLengthStats.intervalSize;
                histData.OFFSET = 0;
                histData.MAX = observationLengthStats.maxValue;
                histData.INTERVALS = histData.DATA.INTERVAL_INDEX.length;
                if (!histData.DATA.empty) {
                    let observationLengthData = atlascharts.histogram.mapHistogram(histData);
                    if (
                        observationLengthData.length > 0 &&
                        observationLengthData[observationLengthData.length - 1].x - observationLengthData[0].x > 1000
                    ) {
                        observationLengthData.forEach((d) => {
                            d.x = d.x / 365.25;
                            d.dx = d.dx / 365.25;
                        });
                        this.chartFormats.observationLength.xLabel = "Years";
                    }

                    this.observationLengthData(observationLengthData);
                }
            }
        }

        parseDurationByGender(data) {
            const bpseries = this.parseBoxPlotData(data);

            let dataMinY = d3.min(bpseries, (d) => d.min);
            let dataMaxY = d3.max(bpseries, (d) => d.max);
            if (dataMaxY - dataMinY > 1000) {
                bpseries.forEach((d) => {
                    d.min = d.min / 365.25;
                    d.LIF = d.LIF / 365.25;
                    d.q1 = d.q1 / 365.25;
                    d.median = d.median / 365.25;
                    d.q3 = d.q3 / 365.25;
                    d.UIF = d.UIF / 365.25;
                    d.max = d.max / 365.25;
                });
                this.chartFormats.durationByGender.yLabel = "Years";
            }
            this.durationByGenderData(bpseries);
        }

        parseCumulativeObservation(data) {
			const normalizedData = ChartUtils.normalizeArray(data);
            if (!normalizedData.empty) {
				const coData = atlascharts.histogram.normalizeDataframe(normalizedData);
				let cumulativeData = [];
				for (let i = 0; i < coData.xLengthOfObservation.length; i++) {
					cumulativeData.push({
                        xValue: coData.xLengthOfObservation[i],
                        yValue: coData.yPercentPersons[i],
                    })
				}
            
                if (cumulativeData.length > 0) {
                    if (cumulativeData.slice(-1)[0].xValue - cumulativeData[0].xValue > 1000) {
                        // convert x data to years
                        cumulativeData.forEach(function (d) {
                            d.xValue = d.xValue / 365.25;
                        });
                        this.chartFormats.cumulativeObservation.yLabel = 'Years';
                    }
                }

				this.cumulativeObservationData(cumulativeData);
            }
        }

        parseBoxPlotData(data) {
            const bpseries = [];
            const bpdata = ChartUtils.normalizeArray(data);

            if (!bpdata.empty) {
                for (let i = 0; i < bpdata.category.length; i++) {
                    bpseries.push({
                        Category: bpdata.category[i],
                        min: bpdata.minValue[i],
                        LIF: bpdata.p10Value[i],
                        q1: bpdata.p25Value[i],
                        median: bpdata.medianValue[i],
                        q3: bpdata.p75Value[i],
                        UIF: bpdata.p90Value[i],
                        max: bpdata.maxValue[i],
                    });
                }
            }

            return bpseries;
        }
    }

    return commonUtils.build("report-observation-period", ObservationPeriodReport, view);
});
