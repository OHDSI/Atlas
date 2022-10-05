define([
	'knockout',
	'text!./death.html',
	'd3',
	'utils/CommonUtils',
	'utils/ChartUtils',
	'const',
	'components/reports/classes/Report',
	'components/Component',
	'components/heading',
	'components/charts/donut',
	'components/charts/line',
	'components/charts/boxplot',
	'components/charts/trellisline',
], function (
	ko,
	view,
	d3,
	commonUtils,
	ChartUtils,
	constants,
	Report,
) {
	class Death extends Report {
		constructor(params) {
			super(params);

			this.name = 'Death';
			this.prevalenceByGenderAgeYearData = ko.observable();
			this.byMonthSeriesLineData = ko.observable();
			this.prevalenceByTypeDonutData = ko.observable();
			this.ageBoxplotData = ko.observable();

			this.chartFormats = {
				prevalenceByGenderAgeYear: {
					trellisSet: null,
					trellisLabel: ko.i18n('dataSources.deathReport.ageDecile', 'Age Decile'),
					seriesLabel: ko.i18n('dataSources.deathReport.yearOfObservation', 'Year of Observation'),
					yLabel: ko.i18n('dataSources.deathReport.prevalencePer1000People', 'Prevalence Per 1000 People'),
					xFormat: d3.timeFormat("%Y"),
					yFormat: d3.format("0.2f"),
					tickPadding: 20,
					colors: d3.scaleOrdinal()
						.domain(['MALE', 'FEMALE', 'UNKNOWN'])
						.range(["#1F78B4", "#FB9A99", "#33A02C"])
				},
				byMonthSeriesLine: {
					xScale: null,
					xFormat: d3.timeFormat("%m/%Y"),
					tickFormat: d3.timeFormat("%Y"),
					xLabel: ko.i18n('dataSources.deathReport.date', 'Date'),
					yLabel: ko.i18n('dataSources.deathReport.prevalencePer1000People', 'Prevalence Per 1000 People'),
					yFormat: d3.format("0.2f"),
					getTooltipBuilder: options => {
						return d => {
							const format = d3.format("0.5f");
							return `
								${options.xLabel}: ${options.xFormat(d.xValue)}<br/>
								${options.yLabel}: ${format(d.yValue)}
							`;
						}
					}
				},
				prevalenceByTypeDonut: {
					margin: {
						top: 5,
						left: 5,
						right: 200,
						bottom: 5
					}
				},
				ageBoxplot: {
					yLabel: ko.i18n('dataSources.deathReport.ageAtFirstOccurence', 'Age at first occurence'),
					xLabel: ko.i18n('dataSources.deathReport.gender', 'Gender'),
					yFormat: d3.format(',.1s'),
					valueFormatter: d3.format('d'),
				},
			};
			this.loadData();

		}

		parseData({ data }) {
			this.prevalenceByGenderAgeYear(data.prevalenceByGenderAgeYear);
			this.prevalenceByMonth(data.prevalenceByMonth);
			this.prevalenceByType(data.deathByType);
			this.ageBoxplot(data.ageAtDeath);
		}

		prevalenceByGenderAgeYear(data) {
			this.chartFormats.prevalenceByGenderAgeYear.trellisSet = constants.defaultDeciles;
			this.prevalenceByGenderAgeYearData(data);
		}

		prevalenceByMonth(data) {
			const prevData = ChartUtils.normalizeArray(data);
			if (!prevData.empty) {
				const byMonthSeries = ChartUtils.mapMonthYearDataToSeries(prevData, {
					dateField: 'xCalendarMonth',
					yValue: 'yPrevalence1000Pp',
					yPercent: 'yPrevalence1000Pp'
				});
				this.byMonthSeriesLineData(byMonthSeries);
				this.chartFormats.byMonthSeriesLine.xScale = d3.scaleTime()
					.domain(d3.extent(byMonthSeries[0].values, d => d.xValue));
			}
		}

		prevalenceByType(data) {
			if (!!data && data.length > 0) {
				this.prevalenceByTypeDonutData(ChartUtils.mapConceptData(data));
			}
		}

		ageBoxplot(data) {
			const bpseries = [];
			const bpdata = ChartUtils.normalizeArray(data);
			if (!bpdata.empty) {
				for (let i = 0; i < bpdata.category.length; i++) {
					bpseries.push({
						Category: bpdata.category[i],
						min: bpdata.minValue[i],
						max: bpdata.maxValue[i],
						median: bpdata.medianValue[i],
						LIF: bpdata.p10Value[i],
						q1: bpdata.p25Value[i],
						q3: bpdata.p75Value[i],
						UIF: bpdata.p90Value[i]
					});
				}
				this.ageBoxplotData(bpseries);
			}
		}
	}

	return commonUtils.build('report-death', Death, view);
});
