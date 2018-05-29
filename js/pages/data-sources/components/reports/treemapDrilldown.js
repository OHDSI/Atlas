define([
  'knockout',
  'text!./treemapDrilldown.html',
  'd3',
  'const',
  'pages/data-sources/classes/Report',
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
  Report
) {
  class TreemapDrilldown extends Report {
    constructor() {
      super();
      this.name = 'treemap-drilldown';
      this.view = view;
      this.currentReport = {};
      this.currentConcept = ko.observable({
        name: '',
      });
      this.isError = ko.observable(false);

      // options
      this.byFrequency = false;
      this.byUnit = false;
      this.byType = false;

      // data
      this.prevalenceByMonthData = ko.observable();
      this.prevalenceByTypeData = ko.observable();
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

    }

    parseAgeData(rawAgeData) {
      const bpseries = [];
      const bpdata = helpers.normalizeArray(rawAgeData);
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
        this.ageData(bpseries);
      }
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
      const ndata = helpers.normalizeArray(
        data.filter(filterByConcept(this.currentConcept().conceptId))
      );
      const bpdata = helpers.normalizeDataframe(ndata);
      if (!bpdata.empty) {
        bpseries = bpdata.category.map(function (v, i) {
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
          yMax: d3.max(rawData, d => d.p90Value) || bpdata.p90Value,
        },
        data: bpseries,
      };
    }

    parsePieData(rawData) {
      const dataByUnit = rawData
        .filter(d => d.measurementConceptId === this.currentConcept().conceptId)
        .map(function (d, i) {
          return {
            id: d.conceptName,
            label: d.conceptName,
            value: d.countValue,
          };
        }, rawData);
      dataByUnit.sort(function (a, b) {
        const nameA = a.label.toLowerCase();
        const nameB = b.label.toLowerCase();
        if (nameA < nameB) //sort string ascending
          return -1;
        if (nameA > nameB)
          return 1;
        return 0; //default return value (no sorting)
      });
      
      return dataByUnit;
    }

    parseData({ data }) {
      this.parseAgeData(data.ageAtFirstOccurrence);
      this.parsePrevalenceByMonth(data.prevalenceByMonth);
      this.parsePrevalenceByType(data.byType);
      this.parsePrevalenceByGenderAgeYear(data.prevalenceByGenderAgeYear);
      if (this.byFrequency) {
        this.parseFrequencyDistribution(data.frequencyDistribution, this.currentReport().path);
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

        this.recordsByUnitData(this.parsePieData(data.recordsByUnit));
        this.valuesRelativeToNormData(this.parsePieData(data.valuesRelativeToNorm));
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

    createViewModel(params) {
      super.createViewModel(params);
      this.currentReport = params.currentReport;
      this.byFrequency = params.byFrequency;
      this.byUnit = params.byUnit;
      this.byType = params.byType;
      params.currentConcept.subscribe(this.loadDrilldown.bind(this));
      this.loadDrilldown(params.currentConcept());
      
      return this;
    }
  }

  const report = new TreemapDrilldown();	
  return report.build();
});
