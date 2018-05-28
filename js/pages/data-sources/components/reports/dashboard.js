define([
	'knockout',
	'text!./dashboard.html',
	'd3',
	'atlascharts',
	'd3-tip',
  'const',
  'pages/data-sources/classes/Report',
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
  helpers,
  Report
) {
	class Dashboard extends Report {
    constructor() {
      super();
      this.name = 'dashboard';      
      this.view = view;
      
      this.summary = ko.observableArray();
      this.genderConceptData = ko.observable();
      this.ageAtFirstObservationData = ko.observable();
      this.observationLineData = ko.observable();
      this.byMonthSeriesData = ko.observable();

      this.chartFormats = {
        ageAtFirstObservation: {
          xFormat: d3.format('d'),
          yFormat: d3.format(',.1s'),
          xLabel: 'Age',
          yLabel: 'People'
        },
        observationLine: {
          yFormat: d3.format('0.0%'),
          interpolate: (new atlascharts.line()).interpolation.curveStepBefore,
          xLabel: 'x label',
          yLabel: 'Percent of Population'
        },
        byMonthSeries: {
          xScale: null,
          xFormat: d3.timeFormat("%m/%Y"),
          tickFormat: d3.timeFormat("%m/%Y"),
          ticks: 10,
          xLabel: "Date",
          yLabel: "People"
        },
      };

    }

    render(params) {
      super.render(params);
      
      this.getData()
        .then(({ data }) => {
          if (!!data.summary) {
            var formatter = d3.format(".5s");
            data.summary.forEach(function (d) {
              if (!isNaN(d.attributeValue)) {
                d.attributeValue = formatter(d.attributeValue);
              }
            });
            this.summary(data.summary);
          }
          this.genderConceptData(helpers.mapConceptData(data.gender));
          const ageAtFirstData = helpers.normalizeArray(data.ageAtFirstObservation);
          if (!ageAtFirstData.empty) {
            const histData = {};
            histData.intervalSize = 1;
            histData.min = d3.min(ageAtFirstData.intervalIndex);
            histData.max = d3.max(ageAtFirstData.intervalIndex);
            histData.intervals = 120;
            histData.data = ageAtFirstData;

            this.ageAtFirstObservationData(helpers.mapHistogram(histData));
          }
          const cumObsData = helpers.normalizeArray(data.cumulativeObservation);
          let cumulativeData = {};
          if (!cumObsData.empty) {
            cumulativeData = helpers.normalizeDataframe(cumObsData).xLengthOfObservation
              .map(function (d, i) {
                const item = {
                  xValue: this.xLengthOfObservation[i],
                  yValue: this.yPercentPersons[i]
                };
                return item;
              }, cumObsData);

            this.chartFormats.observationLine.xLabel = 'Days';
            if (cumulativeData.length > 0) {
              if (cumulativeData.slice(-1)[0].xValue - cumulativeData[0].xValue > 1000) {
                // convert x data to years
                cumulativeData.forEach(function (d) {
                  d.xValue = d.xValue / 365.25;
                });
                this.chartFormats.observationLine.xLabel = 'Years';
              }
            }

            this.observationLineData(cumulativeData);
          }
          const obsByMonthData = helpers.normalizeArray(data.observedByMonth);
          if (!obsByMonthData.empty) {
            this.byMonthSeriesData(helpers.mapMonthYearDataToSeries(obsByMonthData, {
              dateField: 'monthYear',
              yValue: 'countValue',
              yPercent: 'percentValue'
            }));
            this.chartFormats.byMonthSeries.xScale = d3.scaleTime()
              .domain(
                d3.extent(this.byMonthSeriesData()[0].values, function (d) {
                  return d.xValue;
                }
              )
            );
          }
        });
        return this;
    }
  }

  const report = new Dashboard();
  return report.build();
});
