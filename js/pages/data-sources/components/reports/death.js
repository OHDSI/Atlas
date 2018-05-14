define([
	'knockout',
	'text!./death.html',
	'd3',
  'services/http',
  'pages/data-sources/const',
  'pages/data-sources/classes/Report',
  'pages/data-sources/components/report-title',
  'pages/data-sources/components/charts/donut',
  'pages/data-sources/components/charts/line',
  'pages/data-sources/components/charts/boxplot',
  'pages/data-sources/components/charts/trellisline',
], function (
	ko,
	view,
	d3,
  httpService,
  helpers,
  Report
) {
	class Death extends Report {
    constructor() {
      super();
      this.name = 'death';
      this.view = view;
      
      this.prevalenceByGenderAgeYearData = ko.observable();
      this.byMonthSeriesLineData = ko.observable();
      this.prevalenceByTypeDonutData = ko.observable();
      this.ageBoxplotData = ko.observable();

      this.chartFormats = {
        prevalenceByGenderAgeYear: {
					trellisSet: null,
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
        byMonthSeriesLine: {
					xScale: null,
					xFormat: d3.timeFormat("%m/%Y"),
					tickFormat: d3.timeFormat("%Y"),
					xLabel: "Date",
					yLabel: "Prevalence per 1000 People"
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
					yLabel: 'Age at first occurence',
					xLabel: 'Gender',
					yFormat: d3.format(',.1s'),
				},
      };

    }

    prevalenceByGenderAgeYear(data) {
      const trellisData = helpers.normalizeArray(data);
			if (!trellisData.empty) {
				const allDeciles = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-99"];
				const minYear = d3.min(trellisData.xCalendarYear),
					maxYear = d3.max(trellisData.xCalendarYear);

				const seriesInitializer = function (tName, sName, x, y) {
					return {
						trellisName: tName,
						seriesName: sName,
						xCalendarYear: x,
						yPrevalence1000Pp: y
					};
				};

				const nestByDecile = d3.nest()
					.key(function (d) {
						return d.trellisName;
					})
					.key(function (d) {
						return d.seriesName;
					})
					.sortValues(function (a, b) {
						return a.xCalendarYear - b.xCalendarYear;
					});

				// map data into chartable form
				const normalizedSeries = trellisData.trellisName.map(function (d, i) {
					const item = {};
					const container = this;
					d3.keys(container).forEach(function (p) {
						item[p] = container[p][i];
					});
					return item;
				}, trellisData);

				const dataByDecile = nestByDecile.entries(normalizedSeries);
				// fill in gaps
        const yearRange = d3.range(minYear, maxYear, 1);
        let yearData = {};

				dataByDecile.forEach(function (trellis) {
					trellis.values.forEach(function (series) {
						series.values = yearRange.map(function (year) {
							yearData = series.values.filter(function (f) {
								return f.xCalendarYear === year;
							})[0] || seriesInitializer(trellis.key, series.key, year, 0);
							yearData.date = new Date(year, 0, 1);
							return yearData;
						});
					});
				});

        this.prevalenceByGenderAgeYearData(dataByDecile);
        this.chartFormats.prevalenceByGenderAgeYear.trellisSet = allDeciles;
			}
    }

    
    prevalenceByMonth(data) {
      const prevData = helpers.normalizeArray(data);
			if (!prevData.empty) {
        const byMonthSeries = helpers.mapMonthYearDataToSeries(prevData, {
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
        this.prevalenceByTypeDonutData(helpers.mapConceptData(data));
      }
    }

    ageBoxplot(data) {
			const bpseries = [];
			const bpdata = helpers.normalizeArray(data);
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

    render(params) {
      super.render(params);
      
      this.getData()
        .then(({ data }) => {
          this.prevalenceByGenderAgeYear(data.prevalenceByGenderAgeYear);
          this.prevalenceByMonth(data.prevalenceByMonth);
          this.prevalenceByType(data.deathByType);
          this.ageBoxplot(data.ageAtDeath);
        });

        return this;
    }
  }

  const report = new Death();
	return report.build();
});
