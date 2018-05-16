define([
  'knockout',
  'text!./treemapDrilldown.html',
  'd3',
  'services/http',
  'const',
  'pages/data-sources/classes/Report',
  'components/charts/histogram',
  'components/charts/line',
  'components/charts/donut',
  'components/charts/trellisline',
  'components/charts/histogram',
  'components/heading',
  'components/empty-state',
], function (
  ko,
  view,
  d3,
  httpService,
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

      this.prevalenceByMonthData = ko.observable();
      this.prevalenceByTypeData = ko.observable();
      this.ageData = ko.observable();
      this.frequencyDistributionData = ko.observable(); // frequencyhistogram
      this.prevalenceByGenderAgeYearData = ko.observable();
      
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
        frequencyDistribution: {},
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

    parseprevalenceByGenderAgeYear(rawPrevalenceByGenderAgeYear) {
      this.chartFormats.prevalenceByGenderAgeYear.trellisSet = helpers.defaultDeciles;
      this.prevalenceByGenderAgeYearData(rawPrevalenceByGenderAgeYear);
    }

    parseData({ data }) {
      this.parseAgeData(data.ageAtFirstOccurrence);
      this.parsePrevalenceByMonth(data.prevalenceByMonth);
      this.parsePrevalenceByType(data.byType);
      this.parseprevalenceByGenderAgeYear(data.prevalenceByGenderAgeYear);
      /*      
      if (currentReport.byFrequency) {
        self.frequencyDistribution(data, '#frequencyDistribution', currentReport.path);
      }
      if (currentReport.byUnit) {
        var drawPlot = function(data, selector) {
          self.boxplotChart(data, selector, currentConcept.concept_id);
        };
        var drawPie = function(data, selector) {
          self.pieChart(data, selector, currentConcept.concept_id);
        };
        drawPie(data.recordsByUnit, "#recordsByUnit");
        drawPlot(data.measurementValueDistribution, "#measurementValues");
        drawPlot(data.lowerLimitDistribution, "#lowerLimit");
        drawPlot(data.upperLimitDistribution, "#upperLimit");
        drawPie(data.valuesRelativeToNorm, "#relativeToNorm");
      }*/
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

    render(params) {
      super.render(params);
      this.currentReport = params.currentReport;
      params.currentConcept.subscribe(this.loadDrilldown.bind(this));
      this.loadDrilldown(params.currentConcept());
      
      return this;
    }
  }

  const report = new TreemapDrilldown();	
  return report.build();
});
