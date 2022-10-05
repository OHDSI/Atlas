define([
	'knockout',
	'text!./datadensity.html',
	'd3',
	'utils/CommonUtils',
	'utils/ChartUtils',
	'components/reports/classes/Report',
	'components/Component',
	'components/heading',
	'components/charts/boxplot',
	'components/charts/line',
], function (
	ko,
	view,
	d3,
	commonUtils,
	ChartUtils,
	Report
) {
	class datadensity extends Report {
		constructor(params) {
			super(params);

			this.name = 'DataDensity';
			this.totalLineData = ko.observable();
			this.recordsperpersonLineData = ko.observable();
			this.conceptsPerPersonData = ko.observable();

			const getTooltipBuilder = options => d => {
				const yValue = d[options.yValue];
				const value = yValue < 1 ? d3.format('.3f')(yValue) : d3.formatPrefix('.3s', yValue)(yValue);
				return `
					${d.seriesName}<br/>
					${options.xLabel}: ${options.xFormat(d[options.xValue])}<br/>
					${options.yLabel}: ${value}
				`;
			};

			this.chartFormats = {
				totalLine: {
					xScale: null,
					xFormat: d3.timeFormat("%m/%Y"),
					tickFormat: d3.timeFormat("%m/%Y"),
					xValue: "xCalendarMonth",
					yValue: "yRecordCount",
					xLabel: ko.i18n('dataSources.datadensityReport.year', 'Year'),
					yLabel: ko.i18n('dataSources.datadensityReport.numberOfRecords', '# of Records'),
					showLegend: true,
					getTooltipBuilder,
				},
				recordsperpersonLine: {
					xScale: null,
					xFormat: d3.timeFormat("%m/%Y"),
					tickFormat: d3.timeFormat("%m/%Y"),
					xValue: "xCalendarMonth",
					yValue: "yRecordCount",
					xLabel: ko.i18n('dataSources.datadensityReport.year', 'Year'),
					yLabel: ko.i18n('dataSources.datadensityReport.recordsPerPerson', 'Records Per Person'),
					showLegend: true,
					getTooltipBuilder,
				},
				conceptsPerPerson: {
					yMax: 0,
					yFormat: d3.format(',.1s'),
					xLabel: ko.i18n('dataSources.datadensityReport.conceptType', 'Concept Type'),
					yLabel: ko.i18n('dataSources.datadensityReport.conceptsPerPerson', 'Concepts per Person'),
					valueFormatter: d3.format('d'),
				},
			};

			this.loadData();
		}

		parseData({ data }) {
			const totalLine = this.parseLineData(data.totalRecords);
			const recordsPerPerson = this.parseLineData(data.recordsPerPerson);

			this.totalLineData(totalLine.data);
			this.chartFormats.totalLine.xScale = totalLine.xScale;
			this.recordsperpersonLineData(recordsPerPerson.data);
			this.chartFormats.recordsperpersonLine.xScale = recordsPerPerson.xScale;

			if (!!data.conceptsPerPerson) {
				const conceptsSeries = [];
				const conceptsData = ChartUtils.normalizeArray(data.conceptsPerPerson);
				for (let i = 0; i < conceptsData.category.length; i++) {
					conceptsSeries.push({
						Category: conceptsData.category[i],
						min: conceptsData.minValue[i],
						max: conceptsData.maxValue[i],
						median: conceptsData.medianValue[i],
						LIF: conceptsData.p10Value[i],
						q1: conceptsData.p25Value[i],
						q3: conceptsData.p75Value[i],
						UIF: conceptsData.p90Value[i]
					});
				}
				this.conceptsPerPersonData(conceptsSeries);
				this.chartFormats.conceptsPerPerson.yMax = d3.max(conceptsData.p90Value);
			}
		}

		parseLineData(rawData) {
			const result = {
				data: null,
				xScale: null,
			};

			if (!!rawData) {
				const totalRecords = rawData.totalRecords;
				// convert yyyymm to date
				rawData.forEach(function (d, i, ar) {
					const v = d.xCalendarMonth;
					ar[i].xCalendarMonth = new Date(Math.floor(v / 100), (v % 100) - 1, 1);
				});

				// nest dataframe data into key->values pair
				const parsedData = d3.nest()
					.key(d => d.seriesName)
					.entries(rawData)
					.map(d => ({
							name: d.key,
							values: d.values
						})
					);

				result.data = parsedData;
				result.xScale = d3.scaleTime().domain(d3.extent(rawData, d => d.xCalendarMonth));
			}

			return result;
		}
	}

	return commonUtils.build('report-datadensity', datadensity, view);
});
