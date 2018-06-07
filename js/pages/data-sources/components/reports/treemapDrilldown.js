define([
  'knockout',
  'text!./treemapDrilldown.html',
  'd3',
  'const',
  'pages/data-sources/classes/Report',
  'providers/Component',
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
  helpers,
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
          xScale: d3.scaleLinear().domain([1, 10]),
          yScale: d3.scaleLinear().domain([0, 100]),
          yMax: 0,
          xLabel: 'xLabel',
          yLabel: '% of total number of persons'
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
      
      this.currentReport = params.currentReport;
      this.byFrequency = params.byFrequency;
      this.byUnit = params.byUnit;
      this.byType = params.byType;
      this.byValueAsConcept = params.byValueAsConcept;
      this.byOperator = params.byOperator;
      this.byQualifier = params.byQualifier;
      params.currentConcept.subscribe(this.loadDrilldown.bind(this));
      this.loadDrilldown(params.currentConcept());
    }

    parseAgeData(rawAgeData) {
        this.ageData(this.parseBoxplotData(rawAgeData).data);
    }

    parsePrevalenceByMonth(rawPrevalenceByMonth) {
      const prevData = helpers.normalizeArray(rawPrevalenceByMonth);
      if (!prevData.empty) {
        const byMonthSeries = helpers.mapMonthYearDataToSeries(prevData, {
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
        this.prevalenceByTypeData(helpers.mapConceptData(rawPrevalenceByType));
      }
    }

    parsePrevalenceByGenderAgeYear(rawPrevalenceByGenderAgeYear) {
      this.chartFormats.prevalenceByGenderAgeYear.trellisSet = helpers.defaultDeciles;
      this.prevalenceByGenderAgeYearData(rawPrevalenceByGenderAgeYear);
    }

    parseFrequencyDistribution(rawData, report) {
      if (!!rawData) {
        const freqData = helpers.normalizeArray(rawData);
        if (!freqData.empty) {
          // Histogram
          const frequencyHistogram = new Object();
          const frequencyHistData = new Object();
          let totalCnt = 0;
          for (let i in freqData.yNumPersons) {
            totalCnt += freqData.yNumPersons[i];
          }
          frequencyHistData.countValue = freqData.yNumPersons.slice();
          frequencyHistData.intervalIndex = freqData.xCount.slice();
          frequencyHistData.percentValue = freqData.yNumPersons.map(function (value) {
            return (value / totalCnt) * 100;
          });
          frequencyHistogram.data = frequencyHistData;
          frequencyHistogram.min = 0;
          frequencyHistogram.max = 10;
          frequencyHistogram.intervals = 10;
          frequencyHistogram.intervalSize = 1;
          const yScaleMax = (Math.floor((Math.max.apply(null, freqData.yNumPersons) + 5) / 10) + 1) * 10;
          this.chartFormats.frequencyDistribution.yMax = yScaleMax;
          this.chartFormats.frequencyDistribution.xLabel = `Count ('x' or more ${report}s)`;
          const freqHistData = helpers.mapHistogram(frequencyHistogram);
          this.frequencyDistributionData(freqHistData);
        }
      }
    }

    parseBoxplotData(rawData) {
      let bpseries = {};
      const ndata = helpers.normalizeArray(rawData);
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
    }

    parseDonutData(rawData) {
        if (!!rawData && rawData.length > 0) {
            let mappedData = helpers.mapConceptData(rawData);
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

    parseData({ data }) {
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
        this.chartFormats.measurementValueDistribution.yMax = boxplot.chartFormat.yMax;
        this.measurementValueDistributionData(boxplot.data);

        boxplot = this.parseBoxplotData(data.lowerLimitDistribution);
        this.chartFormats.lowerLimitDistribution.yMax = boxplot.chartFormat.yMax;
        this.lowerLimitDistributionData(boxplot.data);

        boxplot = this.parseBoxplotData(data.upperLimitDistribution);
        this.chartFormats.upperLimitDistribution.yMax = boxplot.chartFormat.yMax;
        this.upperLimitDistributionData(boxplot.data);

        this.recordsByUnitData(this.parseDonutData(data.recordsByUnit));
        this.valuesRelativeToNormData(this.parseDonutData(data.valuesRelativeToNorm));
      }
    }

    getData() {
      const response = super.getData();
      // immediately hide report loader
      this.context.loadingReport(false);

      return response;
    }

    loadDrilldown(selectedConcept) {
      this.conceptId = selectedConcept.concept_id;
      this.currentConcept(selectedConcept);
      this.isError(false);
      this.isLoading(true);
      this.getData()
        .then((data) => this.parseData(data))
        .catch((er) => {
          this.isError(true);
          console.error(er);
        });
    }

  }

  return helpers.build(TreemapDrilldown, 'treemap-drilldown', view);
});
