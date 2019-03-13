define([
	'knockout',
	'text!./treemapDrilldown.html',
	'd3',
	'atlascharts',
	'utils/CommonUtils',
	'utils/ChartUtils',
	'const',
	'pages/data-sources/classes/Report',
	'components/Component',
	'components/charts/histogram',
	'components/charts/line',
	'components/charts/donut',
	'components/charts/trellisline',
	'components/charts/histogram',
	'components/charts/frequencyHistogram',
	'components/charts/boxplot',
	'components/heading',
	'components/empty-state',
], function (
	ko,
	view,
	d3,
	atlascharts,
	commonUtils,
	ChartUtils,
	constants,
	Report,
	Component
) {
	class TreemapDrilldown extends Report {
		constructor(params) {
			super(params);

			this.currentConcept = ko.observable({
				name: '',
			});
			this.isError = ko.observable(false);

			// options
			this.byFrequency = false;
			this.byUnit = false;
			this.byType = false;
			this.byValueAsConcept = false;
			this.byOperator = false;
			this.byQualifier = false;

			// data
			this.prevalenceByMonthData = ko.observable();
			this.prevalenceByTypeData = ko.observable();
			this.prevalenceByValueAsConceptData = ko.observable();
			this.prevalenceByQualifierData = ko.observable();
			this.prevalenceByOperatorData = ko.observable();
			this.ageData = ko.observable();
			this.frequencyDistributionData = ko.observable();
			this.prevalenceByGenderAgeYearData = ko.observable();
			this.measurementValueDistributionData = ko.observable();
			this.lowerLimitDistributionData = ko.observable();
			this.upperLimitDistributionData = ko.observable();
			this.recordsByUnitData = ko.observable();
			this.valuesRelativeToNormData = ko.observable();

			this.commonBoxplotChartOptions = {
				yMax: 0,
				xLabel: 'Unit',
				yLabel: 'Measurement Value',
			};

			this.chartFormats = {
				prevalenceByMonth: {
					xScale: null,
					xFormat: d3.timeFormat("%m/%Y"),
					tickFormat: d3.timeFormat("%Y"),
					xLabel: "Date",
					yLabel: "Prevalence per 1000 People",
				},
				prevalenceByType: {
					margin: {
						top: 5,
						left: 5,
						right: 200,
						bottom: 5
					}
				},
				age: {
					xLabel: 'Gender',
					yLabel: 'Age at First Occurrence',
					yFormat: d3.format(',.1s'),
				},
				frequencyDistribution: {
					xFormat: d3.format('d'),
					yFormat: d3.format('d'),
					xScale: d3.scaleLinear().domain([1, 10]),
					yScale: d3.scaleLinear().domain([0, 100]),
					yMax: 0,
					xLabel: 'xLabel',
					yLabel: '% of total number of persons',
					xValue: 'x',
					yValue: 'y',
					getTooltipBuilder: options => d => {
						const yFormat = d3.format('.2f');
						return `
							Count: ${options.xFormat(d[options.xValue])}<br/>
							${options.yLabel}: ${yFormat(d[options.yValue])}
						`;
					},
				},
				prevalenceByGenderAgeYear: {
					trellisSet: [],
					trellisLabel: "Age Decile",
					seriesLabel: "Year of Observation",
					yLabel: "Prevalence Per 1000 People",
					xFormat: d3.timeFormat("%Y"),
					yFormat: d3.format("0.2f"),
					tickPadding: 20,
					colors: d3.scaleOrdinal()
						.domain(['MALE', 'FEMALE', 'UNKNOWN'])
						.range(["#1F78B4", "#FB9A99", "#33A02C"])
				},
				recordsByUnit: {
					...this.commonBoxplotChartOptions,
				},
				measurementValueDistribution: {
					...this.commonBoxplotChartOptions,
				},
				lowerLimitDistribution: {
					...this.commonBoxplotChartOptions,
				},
				upperLimitDistribution: {
					...this.commonBoxplotChartOptions,
				},
				pie: {
					margin: {
						top: 5,
						left: 5,
						right: 200,
						bottom: 5
					}
				},
			};

			this.scrollTo = function (s) {
				var e = $(s);
				if (e.length > 0) {
					e[0].scrollIntoView();
				}
			}

			this.currentReport = params.currentReport;
			this.byFrequency = params.byFrequency;
			this.byUnit = params.byUnit;
			this.byType = params.byType;
			this.byValueAsConcept = params.byValueAsConcept;
			this.byOperator = params.byOperator;
			this.byQualifier = params.byQualifier;
			this.context = params.context;
			this.currentConceptSubscription = params.currentConcept.subscribe(this.loadData.bind(this));
			this.loadData(params.currentConcept());
		}

		dispose() {
			this.currentConceptSubscription.dispose();
		}

		parseAgeData(rawAgeData) {
			this.ageData(this.parseBoxplotData(rawAgeData).data);
		}

		parsePrevalenceByMonth(rawPrevalenceByMonth) {
			const prevData = ChartUtils.normalizeArray(rawPrevalenceByMonth);
			if (!prevData.empty) {
				const byMonthSeries = ChartUtils.mapMonthYearDataToSeries(prevData, {
					dateField: 'xCalendarMonth',
					yValue: 'yPrevalence1000Pp',
					yPercent: 'yPrevalence1000Pp'
				});
				this.chartFormats.prevalenceByMonth.xScale = d3.scaleTime()
					.domain(d3.extent(byMonthSeries[0].values, d => d.xValue));
				this.prevalenceByMonthData(byMonthSeries);
			}
		}

		parsePrevalenceByType(rawPrevalenceByType) {
			if (!!rawPrevalenceByType && rawPrevalenceByType.length > 0) {
				this.prevalenceByTypeData(ChartUtils.mapConceptData(rawPrevalenceByType));
			}
		}

		parsePrevalenceByGenderAgeYear(rawPrevalenceByGenderAgeYear) {
			this.chartFormats.prevalenceByGenderAgeYear.trellisSet = constants.defaultDeciles;
			this.prevalenceByGenderAgeYearData(rawPrevalenceByGenderAgeYear);
		}

		parseFrequencyDistribution(rawData, report) {
			if (!!rawData) {
				const freqData = ChartUtils.normalizeArray(rawData);
				if (!freqData.empty) {
					// Histogram
					const frequencyHistogram = new Object();
					const frequencyHistData = new Object();
					let totalCnt = 0;
					for (let i in freqData.yNumPersons) {
						totalCnt += freqData.yNumPersons[i];
					}
					frequencyHistData.COUNT_VALUE = freqData.yNumPersons.slice();
					frequencyHistData.INTERVAL_INDEX = freqData.xCount.slice();
					frequencyHistData.PERCENT_VALUE = freqData.yNumPersons.map(function (value) {
						return (value / totalCnt) * 100;
					});
					frequencyHistogram.DATA = frequencyHistData;
					frequencyHistogram.OFFSET = 0;
					frequencyHistogram.INTERVALS = frequencyHistData.INTERVAL_INDEX.length;
					frequencyHistogram.INTERVAL_SIZE = 1;
					const yScaleMax = (Math.floor((Math.max.apply(null, freqData.yNumPersons) + 5) / 10) + 1) * 10;
					this.chartFormats.frequencyDistribution.yMax = yScaleMax;
					this.chartFormats.frequencyDistribution.xLabel = `Count ('x' or more ${report}s)`;
					this.chartFormats.frequencyDistribution.ticks = Math.min(5, frequencyHistogram.INTERVALS);
					const freqHistData = atlascharts.histogram.mapHistogram(frequencyHistogram);
					this.frequencyDistributionData(freqHistData);
				}
			}
		}

		parseBoxplotData(rawData) {
			if (!!rawData && rawData.length > 0) {
				let bpseries = {};
				const ndata = ChartUtils.normalizeArray(rawData);
				if (!ndata.empty) {
					bpseries = ndata.category.map(function (v, i) {
						return {
							Category: ndata.category[i],
							min: ndata.minValue[i],
							max: ndata.maxValue[i],
							median: ndata.medianValue[i],
							LIF: ndata.p10Value[i],
							q1: ndata.p25Value[i],
							q3: ndata.p75Value[i],
							UIF: ndata.p90Value[i],
						};
					});
				}

				return {
					chartFormat: {
						yMax: d3.max(rawData, d => d.p90Value) || ndata.p90Value
					},
					data: bpseries
				}
			} else {
				return null;
			}
		}

		parseDonutData(rawData) {
			if (!!rawData && rawData.length > 0) {
				let mappedData = ChartUtils.mapConceptData(rawData);
				mappedData.sort(function (a, b) {
					const nameA = a.label.toLowerCase();
					const nameB = b.label.toLowerCase();
					if (nameA < nameB) //sort string ascending
						return -1;
					if (nameA > nameB)
						return 1;
					return 0; //default return value (no sorting)
				});
				return mappedData;
			}
			return null;
		};

		parseData({
			data
		}) {
			this.parseAgeData(data.ageAtFirstOccurrence);
			this.parsePrevalenceByMonth(data.prevalenceByMonth);
			this.parsePrevalenceByType(data.byType);
			this.parsePrevalenceByGenderAgeYear(data.prevalenceByGenderAgeYear);
			if (this.byFrequency) {
				this.parseFrequencyDistribution(data.frequencyDistribution, this.currentReport.path);
			}

			if (this.byValueAsConcept) {
				this.prevalenceByValueAsConceptData(this.parseDonutData(data.byValueAsConcept));
			}

			if (this.byQualifier) {
				this.prevalenceByQualifierData(this.parseDonutData(data.byQualifier));
			}

			if (this.byOperator) {
				this.prevalenceByOperatorData(this.parseDonutData(data.byOperator));
			}

			if (this.byUnit) {
				let boxplot = this.parseBoxplotData(data.measurementValueDistribution);
				if (boxplot != null) {
					this.chartFormats.measurementValueDistribution.yMax = boxplot.chartFormat.yMax;
					this.measurementValueDistributionData(boxplot.data);
				}

				boxplot = this.parseBoxplotData(data.lowerLimitDistribution);
				if (boxplot != null) {
					this.chartFormats.lowerLimitDistribution.yMax = boxplot.chartFormat.yMax;
					this.lowerLimitDistributionData(boxplot.data);
				}

				boxplot = this.parseBoxplotData(data.upperLimitDistribution);
				if (boxplot != null) {
					this.chartFormats.upperLimitDistribution.yMax = boxplot.chartFormat.yMax;
					this.upperLimitDistributionData(boxplot.data);
				}

				this.recordsByUnitData(this.parseDonutData(data.recordsByUnit));
				this.valuesRelativeToNormData(this.parseDonutData(data.valuesRelativeToNorm));
			}
		}

		getData() {
			const response = super.getData();
			return response;
		}

		loadData(selectedConcept) {
			if (!selectedConcept) {
				return;
			}
			this.conceptId = selectedConcept.concept_id;
			this.currentConcept(selectedConcept);
			this.isError(false);
			this.getData()
				.then((data) => {
					this.parseData(data);
				})
				.catch((er) => {
					this.isError(true);
					console.error(er);
				})
				.finally(() => {
					this.context.model.loadingReportDrilldown(false);
					this.scrollTo("#datasourceReportDrilldownTitle");
				});
		}
	}

	return commonUtils.build('report-treemap-drilldown', TreemapDrilldown, view);
});