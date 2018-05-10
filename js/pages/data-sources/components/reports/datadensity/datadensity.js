define([
	'knockout',
	'text!./datadensity.html',
	'd3',
  'services/http',
  'pages/data-sources/const',
  'pages/data-sources/Report',
  'pages/data-sources/components/report-title/report-title',
  'pages/data-sources/components/charts/boxplot',
  'pages/data-sources/components/charts/line',
	'less!./datadensity.less'
], function (
	ko,
	view,
	d3,
  httpService,
  helpers,
  Report
) {
	class DataDensity extends Report {
    constructor() {
      super();
      this.name = 'datadensity';      
      this.totalLineData = ko.observable();
      this.recordsperpersonLineData = ko.observable();
      this.conceptsPerPersonData = ko.observable();

      this.chartFormats = {
        totalLine: {
          xScale: null,
          xFormat: d3.timeFormat("%m/%Y"),
          tickFormat: d3.timeFormat("%m/%Y"),
          xValue: "xCalendarMonth",
          yValue: "yRecordCount",
          xLabel: "Year",
          yLabel: "# of Records",
          showLegend: true
        },
        recordsperpersonLine: {
          xScale: null,
          xFormat: d3.timeFormat("%m/%Y"),
          tickFormat: d3.timeFormat("%m/%Y"),
          xValue: "xCalendarMonth",
          yValue: "yRecordCount",
          xLabel: "Year",
          yLabel: "Records Per Person",
          showLegend: true
        },
        conceptsPerPerson: {
          yMax: 0,
          yFormat: d3.format(',.1s'),
          xLabel: 'Concept Type',
          yLabel: 'Concepts per Person'
        },
      };

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

    render(params) {
      super.render(params);
      
      this.getData()
        .then(({ data }) => {
          const totalLine = this.parseLineData(data.totalRecords);
          const recordsPerPerson = this.parseLineData(data.recordsPerPerson);

          this.totalLineData(totalLine.data);
          this.chartFormats.totalLine.xScale = totalLine.xScale;
          this.recordsperpersonLineData(recordsPerPerson.data);
          this.chartFormats.recordsperpersonLine.xScale = recordsPerPerson.xScale;

          if (!!data.conceptsPerPerson) {
            const conceptsSeries = [];
            const conceptsData = helpers.normalizeArray(data.conceptsPerPerson);
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
        });

        return this;
    }
  }

  const report = new DataDensity();

	const component = {
		viewModel: report,
		template: view,
	};

	ko.components.register(report.name, component);
	return component;
});
