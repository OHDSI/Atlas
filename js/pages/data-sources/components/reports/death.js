define([
	'knockout',
	'text!./death.html',
	'd3',
  'services/http',
  'const',
  'pages/data-sources/classes/Report',
  'components/heading',
  'components/charts/donut',
  'components/charts/line',
  'components/charts/boxplot',
  'components/charts/trellisline',
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
			this.chartFormats.prevalenceByGenderAgeYear.trellisSet = helpers.defaultDeciles;
			this.prevalenceByGenderAgeYearData(data);
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
