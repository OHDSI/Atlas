(function () {
	define(["jquery", "d3", "jnj_chart", "common", "datatables.net"], function ($, d3, jnj_chart, common) {
		var data_density = {};
		var threshold;

		data_density.render = function (datasource) {

			$('#reportDataDensity svg').remove();
			console.log("DD: " + datasource.folder + "/" + datasource.name);
			$.ajax({
				type: "GET",
				url: common.getUrlFromData(datasource, 'datadensity'),
				contentType: "application/json; charset=utf-8",
			}).done(function (result) {
				
				var totalRecords = result.TOTAL_RECORDS;
				// convert yyyymm to date
				totalRecords.X_CALENDAR_MONTH.forEach(function (d,i,ar) {
					ar[i] = new Date(Math.floor(d/100), (d % 100)-1,1)	
				});
				
				// convert data-frame structure to array of objects
				var normalizedTotalRecords = common.dataframeToArray(totalRecords);
						
				// nest dataframe data into key->values pair																					
				var totalRecordsData = d3.nest()
					.key(function (d) { return d.SERIES_NAME; })
					.entries(normalizedTotalRecords)
					.map(function (d) {
						return { name: d.key, values: d.values};
					});
				

				var totalRecordsLine = new jnj_chart.line();
				totalRecordsLine.render(totalRecordsData, "#reportDataDensity #totalrecords", 900, 250, {
					xScale: d3.time.scale().domain(d3.extent(normalizedTotalRecords, function (d) {
						return d.X_CALENDAR_MONTH;
					})),
					xFormat: d3.time.format("%m/%Y"),
					tickFormat: d3.time.format("%Y"),
					xValue: "X_CALENDAR_MONTH",
					yValue: "Y_RECORD_COUNT",
					xLabel: "Year",
					yLabel: "# of Records",
					showLegend: true,
					colors: d3.scale.category10()
				});
				
				var recordsPerPerson = result.RECORDS_PER_PERSON;
				// convert yyyymm to date
				recordsPerPerson.X_CALENDAR_MONTH.forEach(function (d,i,ar) {
					ar[i] = new Date(Math.floor(d/100), (d % 100)-1,1)	
				});
				
				// convert data-frame structure to array of objects
				var normalizedRecordsPerPerson = common.dataframeToArray(recordsPerPerson);
						
				// nest dataframe data into key->values pair																					
				var recordsPerPersonData = d3.nest()
					.key(function (d) { return d.SERIES_NAME; })
					.entries(normalizedRecordsPerPerson)
					.map(function (d) {
						return { name: d.key, values: d.values};
					});
				

				var recordsPerPersonLine = new jnj_chart.line();
				recordsPerPersonLine.render(recordsPerPersonData, "#reportDataDensity #recordsperperson", 900, 250, {
					xScale: d3.time.scale().domain(d3.extent(normalizedRecordsPerPerson, function (d) {
						return d.X_CALENDAR_MONTH;
					})),
					xFormat: d3.time.format("%m/%Y"),
					tickFormat: d3.time.format("%Y"),
					xValue: "X_CALENDAR_MONTH",
					yValue: "Y_RECORD_COUNT",
					xLabel: "Year",
					yLabel: "Records Per Person",
					showLegend: true,
					colors: d3.scale.category10()
				});
				
				
				var conceptsBoxplot = new jnj_chart.boxplot();
				var conceptsSeries = [];
				var conceptsData = common.normalizeDataframe(result.CONCEPTS_PER_PERSON);
				for (i = 0; i < conceptsData.CATEGORY.length; i++) {
					conceptsSeries.push({
						Category: conceptsData.CATEGORY[i],
						min: conceptsData.MIN_VALUE[i],
						max: conceptsData.MAX_VALUE[i],
						median: conceptsData.MEDIAN_VALUE[i],
						LIF: conceptsData.P10_VALUE[i],
						q1: conceptsData.P25_VALUE[i],
						q3: conceptsData.P75_VALUE[i],
						UIF: conceptsData.P90_VALUE[i]
					});
				}
				conceptsBoxplot.render(conceptsSeries, "#reportDataDensity #conceptsperperson", 800, 200, {
					yMax: d3.max(conceptsData.P90_VALUE),
					xLabel: 'Concept Type',
					yLabel: 'Concepts per Person'
				});
				
				$('#reportDataDensity').show();
			});
			
		}
		return data_density;
	});
})();
