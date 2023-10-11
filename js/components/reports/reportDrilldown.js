define([
	'knockout',
	'text!./reportDrilldown.html',
	'd3',
	'atlascharts',
	'utils/CommonUtils',
	'utils/ChartUtils',
	'const',
	'./classes/Report',
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
	Report
) {
	class ReportDrilldown extends Report {
		constructor(params) {
			super(params);

			this.currentConcept = ko.observable({
				name: '',
			});
			this.isError = ko.observable(false);
			this.hideReportName = ko.observable(params.hideReportName || false);

			// options
			this.byFrequency = false;
			this.byUnit = false;
			this.byType = false;
			this.byValueAsConcept = false;
			this.byOperator = false;
			this.byQualifier = false;
			this.byLengthOfEra = false;

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
			this.lengthOfEra = ko.observable();

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
					xLabel: ko.i18n('dataSources.drilldown.chartFormat.date', 'Date'),
					yLabel: ko.i18n('dataSources.drilldown.chartFormat.prevalencePer1000People', 'Prevalence per 1000 People'),
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
					xLabel: ko.i18n('dataSources.drilldown.chartFormat.gender', 'Gender'),
					yLabel: ko.i18n('dataSources.drilldown.chartFormat.ageAtFirstOccurrence', 'Age at First Occurrence'),
					yFormat: d3.format(',.1s'),
				},
				frequencyDistribution: {
					xFormat: d3.format('d'),
					yFormat: d3.format('d'),
					xScale: d3.scaleLinear().domain([1, 10]),
					yScale: d3.scaleLinear().domain([0, 100]),
					yMax: 0,
					xLabel: 'xLabel',
					yLabel: ko.i18n('dataSources.drilldown.chartFormat.percentOfTotalNumberOfPersons', '% of total number of persons'),
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
					trellisLabel: ko.i18n('dataSources.drilldown.chartFormat.ageDecile', 'Age Decile'),
					seriesLabel: ko.i18n('dataSources.drilldown.chartFormat.yearOfObservation', 'Year of Observation'),
					yLabel: ko.i18n('dataSources.drilldown.chartFormat.prevalencePer1000People', 'Prevalence Per 1000 People'),
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
				lengthOfEra: {
					yLabel: ko.i18n('dataSources.dashboardReport.days', 'Days'),
					yFormat: d3.format('d')
				},
			};

			this.currentReport = params.currentReport();
			this.byFrequency = params.byFrequency;
			this.byUnit = params.byUnit;
			this.byType = params.byType;
			this.byValueAsConcept = params.byValueAsConcept;
			this.byOperator = params.byOperator;
			this.byQualifier = params.byQualifier;
			this.byLengthOfEra = params.byLengthOfEra;
			this.context = params.context;
			this.refreshReport = !!params.refreshReport;
			this.subscriptions.push(params.currentConcept.subscribe(this.loadData.bind(this)));

			if (params.currentSource) {
				this.subscriptions.push(params.currentSource.subscribe(newValue => {
					if (newValue && this.refreshReport) {
						this.loadData(params.currentConcept());
					}
				})
			)};
			this.loadData(params.currentConcept());
			this.reportName = ko.computed(() => this.currentConcept().name ? `${this.currentReport.name()}_${this.currentConcept().name}`: `${this.currentReport.name()}`);
			this.isData= ko.observable(true);
		}

		parseAgeData(rawAgeData) {
			this.ageData(this.parseBoxplotData(rawAgeData)?.data);
		}

		parseLengthOfEra(rawLengthOfEra) {
			this.lengthOfEra(this.parseBoxplotData(rawLengthOfEra).data);
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
			} else {
				this.prevalenceByMonthData(null);
			}
		}

		parsePrevalenceByType(rawPrevalenceByType) {
			if (!!rawPrevalenceByType && rawPrevalenceByType.length > 0) {
				this.prevalenceByTypeData(ChartUtils.mapConceptData(rawPrevalenceByType));
			} else {
				this.prevalenceByTypeData(null);
			}
		}

		parsePrevalenceByGenderAgeYear(rawPrevalenceByGenderAgeYear) {
			if (rawPrevalenceByGenderAgeYear) {
				this.chartFormats.prevalenceByGenderAgeYear.trellisSet = constants.defaultDeciles;
				this.prevalenceByGenderAgeYearData(rawPrevalenceByGenderAgeYear);
			} else {
				this.prevalenceByGenderAgeYearData(null);
			}
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
					this.chartFormats.frequencyDistribution.xLabel = ko.pureComputed(function () {
						return ko.i18n('dataSources.drilldown.chartFormat.frequencyDistribution.xLabel1', 'Count ("x" or more ')() +
							report() +
							ko.i18n('dataSources.drilldown.chartFormat.frequencyDistribution.xLabel2', 's)')();
					});
					this.chartFormats.frequencyDistribution.ticks = Math.min(5, frequencyHistogram.INTERVALS);
					const freqHistData = atlascharts.histogram.mapHistogram(frequencyHistogram);
					this.frequencyDistributionData(freqHistData);
				}
			} else {
				this.frequencyDistributionData(null);
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
				this.parseFrequencyDistribution(data.frequencyDistribution, this.currentReport.name());
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

			if (this.byLengthOfEra) {
				this.parseLengthOfEra(data.lengthOfEra);
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

		checkData(data) {
			const isData = Object.values(data).find(item => !!item.length);
			this.isData(!!isData);
		}
		getData() {
			const response = super.getData();
			return response;
		}

		loadData(selectedConcept) {
			if (!selectedConcept) {
				return;
			}

			this.context.loadingDrilldownDone(false);
			this.conceptId = selectedConcept.concept_id !== undefined ?  selectedConcept.concept_id : selectedConcept.CONCEPT_ID;
			this.currentConcept(selectedConcept);
			this.isError(false);
			this.getData()
				.then((data) => {
					this.checkData(data.data);
					this.parseData(data);
					this.context.loadingDrilldownDone(true);
					this.context.showLoadingDrilldownModal(false);
					if (!this.hideReportName()) {
						setTimeout(() => document.getElementById('drilldownReport').scrollIntoView(), 0);
					}
				})
				.catch((er) => {
					this.isError(true);
					console.error(er);
					this.context.loadingDrilldownDone(true);
					this.context.showLoadingDrilldownModal(false);
				});
		}
	}

	return commonUtils.build('report-drilldown', ReportDrilldown, view);
});