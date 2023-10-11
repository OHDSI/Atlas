define([
    "knockout",
    "text!./observation-period.html",
    "d3",
    "atlascharts",
    "utils/CommonUtils",
    "utils/ChartUtils",
    "const",
    'components/reports/classes/Report',
    "components/Component",
    "components/charts/histogram",
    "components/charts/boxplot",
    "components/charts/line",
    "components/charts/donut",
    "components/heading",
], function (ko, view, d3, atlascharts, commonUtils, ChartUtils, constants, Report, Component) {
    class ObservationPeriodReport extends Report {
        constructor(params) {
            super(params);

            this.name = 'ObservationPeriod';
            // plots
            this.ageAtFirstObservationData = ko.observable();
            this.ageByGenderData = ko.observable();
            this.observationLengthData = ko.observable();
            this.durationByGenderData = ko.observable();
            this.cumulativeObservationData = ko.observable();
            this.durationByAgeDecileData = ko.observable();
            this.personsWithContinuousObservationsByYearData = ko.observable();
            this.observationPeriodsPerPersonData = ko.observable();
            this.personsWithContinuousObservationByMonthData = ko.observable();

            this.chartFormats = {
                ageAtFirstObservation: {
                    xLabel: ko.i18n('dataSources.observationPeriodReport.age', 'Age'),
                    yLabel: ko.i18n('dataSources.observationPeriodReport.people', 'People'),
                    xFormat: d3.format("d"),
                    yFormat: d3.format(",.1s"),
                },
                ageByGender: {
                    yLabel: ko.i18n('dataSources.observationPeriodReport.age', 'Age'),
                    xLabel: ko.i18n('dataSources.observationPeriodReport.gender', 'Gender'),
                    yFormat: d3.format(",.1s"),
                    valueFormatter: d3.format("d"),
                },
                observationLength: {
                    xLabel: ko.i18n('dataSources.observationPeriodReport.days', 'Days'),
                    yLabel: ko.i18n('dataSources.observationPeriodReport.people', 'People'),
                    xFormat: (d) => this.formatToFixed(d),
                    yFormat: d3.format(",.1s"),
                },
                durationByGender: {
                    yLabel: ko.i18n('dataSources.observationPeriodReport.days', 'Days'),
                    xLabel: ko.i18n('dataSources.observationPeriodReport.gender', 'Gender'),
                    yFormat: (d) => this.formatToFixed(d),
                    valueFormatter: d3.format("d"),
                },
                cumulativeObservation: {
                    yFormat: d3.format("0.0%"),
                    xFormat: (d) => this.formatToFixed(d),
                    interpolate: new atlascharts.line().interpolation.curveStepBefore,
                    xLabel: ko.i18n('dataSources.observationPeriodReport.days', 'Days'),
                    yLabel: ko.i18n('dataSources.observationPeriodReport.percentOfPopulation', 'Percent of Population'),
                },
                durationByAgeDecile: {
                    yLabel: ko.i18n('dataSources.observationPeriodReport.days', 'Days'),
                    xLabel: ko.i18n('dataSources.observationPeriodReport.ageDecile', 'Age Decile'),
                    yFormat: (d) => this.formatToFixed(d),
                    valueFormatter: d3.format("d"),
                },
                personsWithContinuousObservationsByYear: {
                    xLabel: ko.i18n('dataSources.observationPeriodReport.years', 'Years'),
                    yLabel: ko.i18n('dataSources.observationPeriodReport.people', 'People'),
                    xFormat: d3.format("d"),
                    yFormat: d3.format(",.1s"),
                },
                personsWithContinuousObservationByMonth: {
                    xScale: null,
                    xFormat: d3.timeFormat("%m/%Y"),
                    tickFormat: d3.timeFormat("%Y"),
                    xLabel: ko.i18n('dataSources.observationPeriodReport.date', 'Date'),
                    yLabel: ko.i18n('dataSources.observationPeriodReport.people', 'People'),
                    yFormat: d3.format(",.1s"),
                    getTooltipBuilder: (options) => (d) => {
                        const format = d3.format(",.4s");
                        return `
                            ${options.xLabel}: ${options.xFormat(d.xValue)}<br/>
                            ${options.yLabel}: ${format(d.yValue)}
                        `;
                    },
                },
            };

            this.loadData();
        }

        parseData({ data }) {
            this.parseAgeAtFirstObservation(data.ageAtFirst);
            this.parseAgeByGender(data.ageByGender);
            this.parseObservationLength(data.observationLength, data.observationLengthStats);
            this.parseDurationByGender(data.durationByGender);
            this.parseCumulativeObservation(data.cumulativeObservation);
            this.parseDurationByAgeDecile(data.durationByAgeDecile);
            this.parsePersonsWithContinuousObservationByYear(
                data.personsWithContinuousObservationsByYear,
                data.personsWithContinuousObservationsByYearStats
            );
            this.parseObservationPeriodsPerPerson(data.observationPeriodsPerPerson);
            this.parsePersonsWithContinuousObservationByMonth(data.observedByMonth);
        }

        parseAgeAtFirstObservation(data) {
            const histData = this.parseHistogramData(data);
            this.ageAtFirstObservationData(atlascharts.histogram.mapHistogram(histData));
        }

        parseAgeByGender(data) {
            const bpseries = this.parseBoxPlotData(data);
            this.ageByGenderData(bpseries);
        }

        parseObservationLength(observationLength, [observationLengthStats]) {
            const histData = this.parseHistogramData(observationLength);
            if(observationLengthStats) {
                histData.INTERVAL_SIZE = observationLengthStats.intervalSize;
                histData.OFFSET = 0;
                histData.MAX = observationLengthStats.maxValue;
                histData.INTERVALS = histData.DATA.INTERVAL_INDEX.length;
            }
            // convert to years
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
                    this.chartFormats.observationLength.xLabel = ko.i18n('dataSources.observationPeriodReport.years', 'Years');
                }
                this.observationLengthData(observationLengthData);
            }
        }

        parseDurationByGender(data) {
            const bpseries = this.parseBoxPlotData(data);
            this.mapDaysToYears(bpseries, "durationByGender");
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
                    });
                }
                // convert to years
                if (cumulativeData.length > 0 && cumulativeData.slice(-1)[0].xValue - cumulativeData[0].xValue > 1000) {
                    cumulativeData.forEach((d) => {
                        d.xValue = d.xValue / 365.25;
                    });
                    this.chartFormats.cumulativeObservation.xLabel = ko.i18n('dataSources.observationPeriodReport.years', 'Years');
                }

                this.cumulativeObservationData(cumulativeData);
            }
        }

        parseDurationByAgeDecile(data) {
            this.sortDataByParam(data, "category");
            const bpseries = this.parseBoxPlotData(data);
            this.mapDaysToYears(bpseries, "durationByAgeDecile");

            this.durationByAgeDecileData(bpseries);
        }

        parsePersonsWithContinuousObservationByYear(personsWithContinuousObservationsByYear, [personsWithContinuousObservationsByYearStats]) {
            const histData = this.parseHistogramData(personsWithContinuousObservationsByYear);
            const stats = personsWithContinuousObservationsByYearStats;
            if (stats) {
                histData.INTERVAL_SIZE = stats.intervalSize;
                histData.MAX = stats.maxValue;
                histData.OFFSET = stats.minValue;
                histData.MAX = stats.maxValue;
            }
            const ticks = histData.DATA.INTERVAL_INDEX.length + 1;
            if (ticks < 10) {
                this.chartFormats.personsWithContinuousObservationsByYear.ticks = ticks;
            }

            this.personsWithContinuousObservationsByYearData(atlascharts.histogram.mapHistogram(histData));
        }

        parseObservationPeriodsPerPerson(data) {
            this.observationPeriodsPerPersonData(ChartUtils.mapConceptData(data));
        }

        parsePersonsWithContinuousObservationByMonth(data) {
            const obsByMonthData = ChartUtils.normalizeArray(data);
            if (!obsByMonthData.empty) {
                const byMonthSeries = ChartUtils.mapMonthYearDataToSeries(obsByMonthData, {
                    dateField: "monthYear",
                    yValue: "countValue",
                    yPercent: "percentValue",
                });
                this.personsWithContinuousObservationByMonthData(byMonthSeries);
                this.chartFormats.personsWithContinuousObservationByMonth.xScale = d3
                    .scaleTime()
                    .domain(d3.extent(byMonthSeries[0].values, (d) => d.xValue));
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

        parseHistogramData(data) {
            const histData = {};
            if (data && data.length > 0) {
                let observationDataMapped = data.map((value) => ({
                    INTERVAL_INDEX: value.intervalIndex,
                    COUNT_VALUE: value.countValue,
                }));
                histData.OFFSET = 0;
                histData.INTERVAL_SIZE = 1;
                histData.DATA = ChartUtils.normalizeArray(observationDataMapped);
                histData.INTERVALS = histData.DATA.INTERVAL_INDEX.length;
            }

            return histData;
        }

        mapDaysToYears(bpseries, chartFormatKey) {
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
                this.chartFormats[chartFormatKey].yLabel = ko.i18n('dataSources.observationPeriodReport.years', 'Years');
            }
        }

        sortDataByParam(data, param) {
            data.sort((a, b) => {
                if (a[param] < b[param]) return -1;
                if (a[param] > b[param]) return 1;
                return 0;
            });
        }

        formatToFixed(d) {
            return d < 10 ? d3.format(".1f")(d) : d3.format("d")(d);
        }
    }

    return commonUtils.build("report-observation-period", ObservationPeriodReport, view);
});
