define([
	'knockout',
	'text!./dashboard.html',
	'd3',
	'atlascharts',
	'd3-tip',
	'utils/CommonUtils',
	'utils/ChartUtils',
	'components/reports/classes/Report',
	'components/Component',
	'components/heading',
	'components/charts/donut',
	'components/charts/histogram',
	'components/charts/line',
], function (
	ko,
	view,
	d3,
	atlascharts,
	d3tip,
	commonUtils,
	ChartUtils,
	Report
) {

	const FORMAT_VALUES_BIGGER_THAN = 99999;

	class Dashboard extends Report {
		constructor(params) {
			super(params);

			this.summary = ko.observableArray();
			this.genderConceptData = ko.observable();
			this.ageAtFirstObservationData = ko.observable();
			this.observationLineData = ko.observable();
			this.byMonthSeriesData = ko.observable();
            this.name = 'Dashboard';
			this.chartFormats = {
				ageAtFirstObservation: {
					xFormat: d3.format('d'),
					yFormat: d3.format(',.1s'),
					xLabel: ko.i18n('dataSources.dashboardReport.age', 'Age'),
					yLabel: ko.i18n('dataSources.dashboardReport.people', 'People')
				},
				observationLine: {
					yFormat: d3.format('0.0%'),
					xFormat: function (d) {
						if (d < 10) {
							return d3.format('.2n')(d)
						} else {
							return d3.format('d')(d)
						}
					},
					interpolate: (new atlascharts.line()).interpolation.curveStepBefore,
					xLabel: 'x label',
					yLabel: ko.i18n('dataSources.dashboardReport.percentOfPopulation', 'Percent of Population')
				},
				byMonthSeries: {
					xScale: null,
					xFormat: d3.timeFormat("%m/%Y"),
					tickFormat: d3.timeFormat("%m/%Y"),
					ticks: 10,
					xLabel: ko.i18n('dataSources.dashboardReport.date', 'Date'),
					yLabel: ko.i18n('dataSources.dashboardReport.people', 'People'),
				},
			};

			this.loadData();
		}

		parseData({
			data
		}) {
			if (!!data.summary) {
				var formatter = d3.format(".5s");
				data.summary.forEach(function (d) {
					if (!isNaN(d.attributeValue)) {
						d.attributeValue = d.attributeValue > FORMAT_VALUES_BIGGER_THAN
							? formatter(d.attributeValue) : d.attributeValue;
					}
				});
				this.summary(data.summary);
			}
			this.genderConceptData(ChartUtils.mapConceptData(data.gender));

			const ageAtFirstData = data.ageAtFirstObservation;
			if (!ageAtFirstData.empty) {
				const histData = {};
				histData.INTERVAL_SIZE = 1;
				let ageAtFirstDataMapped = ageAtFirstData.map(value => ({
					INTERVAL_INDEX: value.intervalIndex,
					COUNT_VALUE: value.countValue
				}));
				histData.DATA = ChartUtils.normalizeArray(ageAtFirstDataMapped);
				histData.OFFSET = 0;
				histData.INTERVALS = histData.DATA.INTERVAL_INDEX.length;
				this.ageAtFirstObservationData(atlascharts.histogram.mapHistogram(histData));
			}
			const cumObsData = ChartUtils.normalizeArray(data.cumulativeObservation);
			let cumulativeData = {};
			if (!cumObsData.empty) {
				cumulativeData = atlascharts.chart.normalizeDataframe(cumObsData).xLengthOfObservation
					.map(function (d, i) {
						const item = {
							xValue: this.xLengthOfObservation[i],
							yValue: this.yPercentPersons[i]
						};
						return item;
					}, cumObsData);

				this.chartFormats.observationLine.xLabel = ko.i18n('dataSources.dashboardReport.days', 'Days');
				if (cumulativeData.length > 0) {
					if (cumulativeData.slice(-1)[0].xValue - cumulativeData[0].xValue > 1000) {
						// convert x data to years
						cumulativeData.forEach(function (d) {
							d.xValue = d.xValue / 365.25;
						});
						this.chartFormats.observationLine.xLabel = ko.i18n('dataSources.dashboardReport.years', 'Years');
					}
				}

				this.observationLineData(cumulativeData);
			}
			const obsByMonthData = ChartUtils.normalizeArray(data.observedByMonth);
			if (!obsByMonthData.empty) {
				this.byMonthSeriesData(ChartUtils.mapMonthYearDataToSeries(obsByMonthData, {
					dateField: 'monthYear',
					yValue: 'countValue',
					yPercent: 'percentValue'
				}));
				this.chartFormats.byMonthSeries.xScale = d3.scaleTime()
					.domain(
						d3.extent(this.byMonthSeriesData()[0].values, function (d) {
							return d.xValue;
						})
					);
			}
		}

	}

	return commonUtils.build('report-dashboard', Dashboard, view);
});