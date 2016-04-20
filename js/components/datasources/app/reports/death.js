(function () {
	define(["jquery", "d3", "jnj_chart", "common", "datatables.net"], function ($, d3, jnj_chart, common) {
		var module = {};

		module.render = function (datasource) {

			$('#reportDeath svg').remove();

			$.ajax({
				type: "GET",
				url: common.getUrlFromData(datasource, "death"),
				contentType: "application/json; charset=utf-8",
			}).done(function (result) {

				// render trellis
				trellisData = result.PREVALENCE_BY_GENDER_AGE_YEAR;

				var allDeciles = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-99"];
				var allSeries = ["MALE", "FEMALE"];
				var minYear = d3.min(trellisData.X_CALENDAR_YEAR),
					maxYear = d3.max(trellisData.X_CALENDAR_YEAR);

				var seriesInitializer = function (tName, sName, x, y) {
					return {
						TRELLIS_NAME: tName,
						SERIES_NAME: sName,
						X_CALENDAR_YEAR: x,
						Y_PREVALENCE_1000PP: y
					};
				}

				var nestByDecile = d3.nest()
					.key(function (d) {
						return d.TRELLIS_NAME;
					})
					.key(function (d) {
						return d.SERIES_NAME;
					})
					.sortValues(function (a, b) {
						return a.X_CALENDAR_YEAR - b.X_CALENDAR_YEAR;
					});

				// map data into chartable form
				var normalizedSeries = trellisData.TRELLIS_NAME.map(function (d, i) {
					var item = {};
					var container = this;
					d3.keys(container).forEach(function (p) {
						item[p] = container[p][i];
					});
					return item;
				}, trellisData);

				var dataByDecile = nestByDecile.entries(normalizedSeries);
				// fill in gaps
				var yearRange = d3.range(minYear, maxYear, 1);

				dataByDecile.forEach(function (trellis) {
					trellis.values.forEach(function (series) {
						series.values = yearRange.map(function (year) {
							yearData = series.values.filter(function (f) {
								return f.X_CALENDAR_YEAR == year;
							})[0] || seriesInitializer(trellis.key, series.key, year, 0);
							yearData.date = new Date(year, 0, 1);
							return yearData;
						})
					})
				});

				// create svg with range bands based on the trellis names
				var chart = new jnj_chart.trellisline();
				chart.render(dataByDecile, "#reportDeath #trellisLinePlot", 1000, 300, {
					trellisSet: allDeciles,
					trellisLabel: "Age Decile",
					seriesLabel: "Year of Observation",
					yLabel: "Prevalence Per 1000 People",
					xFormat: d3.time.format("%Y"),
					yFormat: d3.format("0.2f"),
					tickPadding: 20,
					colors: d3.scale.ordinal()
						.domain(["MALE", "FEMALE"])
						.range(["#1f77b4", "#ff7f0e"])
				});

				// prevalence by month
				var byMonthSeries = common.mapMonthYearDataToSeries(result.PREVALENCE_BY_MONTH, {
					dateField: 'X_CALENDAR_MONTH',
					yValue: 'Y_PREVALENCE_1000PP',
					yPercent: 'Y_PREVALENCE_1000PP'
				});

				var prevalenceByMonth = new jnj_chart.line();
				prevalenceByMonth.render(byMonthSeries, "#reportDeath #deathPrevalenceByMonth", 1000, 300, {
					xScale: d3.time.scale().domain(d3.extent(byMonthSeries[0].values, function (d) {
						return d.xValue;
					})),
					xFormat: d3.time.format("%m/%Y"),
					tickFormat: d3.time.format("%Y"),
					xLabel: "Date",
					yLabel: "Prevalence per 1000 People"
				});

				// death type
				genderDonut = new jnj_chart.donut();
				genderDonut.render(common.mapConceptData(result.DEATH_BY_TYPE), "#reportDeath #deathByType", 500, 300, {
					margin: {
						top: 5,
						left: 5,
						right: 200,
						bottom: 5
					}
				});

				// Age At Death
				var boxplot = new jnj_chart.boxplot();
				bpseries = [];
				bpdata = common.normalizeDataframe(result.AGE_AT_DEATH);
				for (i = 0; i < bpdata.CATEGORY.length; i++) {
					bpseries.push({
						Category: bpdata.CATEGORY[i],
						min: bpdata.MIN_VALUE[i],
						max: bpdata.MAX_VALUE[i],
						median: bpdata.MEDIAN_VALUE[i],
						LIF: bpdata.P10_VALUE[i],
						q1: bpdata.P25_VALUE[i],
						q3: bpdata.P75_VALUE[i],
						UIF: bpdata.P90_VALUE[i]
					});
				}
				boxplot.render(bpseries, "#reportDeath #ageAtDeath", 500, 300, {
					xLabel: 'Gender',
					yLabel: 'Age at Death'
				});

			});
		}
		return module;
	});
})();
