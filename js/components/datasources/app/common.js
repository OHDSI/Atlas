define(["d3","appConfig"], function (d3,config) {

	function mapConceptData(data) {
		var result;

		if (data.COUNT_VALUE instanceof Array) // multiple rows, each value of each column is in the indexed properties.
		{
			result = data.COUNT_VALUE.map(function (d, i) {
				var datum = {}
				datum.id = (this.CONCEPT_ID || this.CONCEPT_NAME)[i];
				datum.label = this.CONCEPT_NAME[i];
				datum.value = this.COUNT_VALUE[i];
				return datum;
			}, data);

			result = result.sort(function (a, b) {
				return b.label < a.label ? 1 : -1;
			});
		} else // the dataset is a single value result, so the properties are not arrays.
		{
			result = [
				{
					id: data.CONCEPT_ID,
					label: data.CONCEPT_NAME,
					value: data.COUNT_VALUE
			}];
		}
		return result;
	}

	var simpledata = ["achillesheel", "condition_treemap", "conditionera_treemap", "dashboard", "datadensity", "death", "drug_treemap", "drugera_treemap", "measurement_treemap", "observation_treemap", "observationperiod", "person", "procedure_treemap", "visit_treemap"];
	var collectionFormats = {
		"conditioneras": "condition_{id}.json",
		"conditions": "condition_{id}.json",
		"drugeras": "drug_{id}.json",
		"drugs": "drug_{id}.json",
		"measurements": "measurement_{id}.json",
		"observations": "observation_{id}.json",
		"procedures": "procedure_{id}.json",
		"visits": "visit_{id}.json"
	}

	function getUrlFromData(datasource, name) {

		if (datasource === undefined) {
			console.error("datasource is undefined.");
			return;
		}
		if (!collectionFormats.hasOwnProperty(name) && simpledata.indexOf(name) < 0) {
			console.error("'" + name + "' not found in collectionFormats or simpledata.");
			return;
		}
		var parent = "";

		if (datasource.parentUrl !== undefined) parent += datasource.parentUrl + "/";

		var pth = "";

		if (datasource.map !== undefined) {
			if (datasource.map[name] !== undefined) {
				if (datasource.map[name].type !== undefined) {
					switch (datasource.map[name].type) {
					case 'folder':
					case 'collection':
						if (!collectionFormats.hasOwnProperty(name)) {
							return;
						}
						pth += parent + datasource.map[name].url;
						break;
					case 'service':
					case 'file':
						if (simpledata.indexOf(name) < 0) {
							return;
						}
						pth += parent + datasource.map[name].url;
						break;
					}
				}
			}
		} else if (datasource.url !== undefined) {
			pth += parent + datasource.url + "/" + name;
			if (simpledata.indexOf(name) >= 0) pth += ".json";
		} else if (datasource.folder !== undefined) {
			pth += "data/" + datasource.folder + "/" + name;
			if (simpledata.indexOf(name) >= 0) pth += ".json";
		} else {
			//datasource.filter(function (x) {return x.sourceName == name}) !== undefined)
			//console.log(datasource);
			//console.log(datasource.length);
			pth = config.webAPIRoot + datasource.sourceName + "/" + "cdmresults" + "/" + name;
			console.log("pth=" + pth);
			var serviceDependent = true;
			//console.error("Could not construct path from map, datasource.url or datasource.folder");
			//return;
		}

		if (!serviceDependent) {
			parent = config.dataSourcesRoot;
			pth = parent + "/" + datasource.folder + "/" + name + ".json";
		}

		return pth;
	}

	function getUrlFromDataCollection(datasource, name, id) {

		if (datasource === undefined) return;
		if (!collectionFormats.hasOwnProperty(name)) return;
		var parent = "";
		if (datasource.parentUrl !== undefined) parent += datasource.parentUrl + "/";
		var pth = "";

		if (datasource.map !== undefined) {
			if (datasource.map[name] !== undefined) {
				if (datasource.map[name].type !== undefined && (datasource.map[name].type === 'folder' || datasource.map[name].type === 'collection')) {
					if (!collectionFormats.hasOwnProperty(name)) {
						return;
					}
					pth += parent + datasource.map[name].url.replace("{id}", id);
				}
			}
		} else if (datasource.url !== undefined) {
			pth += parent + datasource.url + "/" + name + "/" + collectionFormats[name].replace("{id}", id);
			if (simpledata.indexOf(name) >= 0) pth += ".json";
		} else if (datasource.folder !== undefined) {
			pth += "data/" + datasource.folder + "/" + name + "/" + collectionFormats[name].replace("{id}", id);
		}

		parent = config.dataSourcesRoot;
		pth = parent + "/" + datasource.folder + "/" + name + "/" + collectionFormats[name].replace("{id}", id);

		return pth;
	}


	function mapHistogram(histogramData) {
		// result is an array of arrays, each element in the array is another array containing information about each bar of the histogram.
		var result = new Array();
		var minValue = histogramData.MIN;
		var intervalSize = histogramData.INTERVAL_SIZE;

		histogramData.DATA = normalizeDataframe(histogramData.DATA);
		for (var i = 0; i <= histogramData.INTERVALS; i++) {
			var target = new Object();
			target.x = minValue + 1.0 * i * intervalSize;
			target.dx = intervalSize;
			target.y = histogramData.DATA.COUNT_VALUE[histogramData.DATA.INTERVAL_INDEX.indexOf(i)] || 0;
			result.push(target);
		};

		return result;
	}

	function mapMonthYearDataToSeries(data, options) {
		var defaults = {
			dateField: "x",
			yValue: "y",
			yPercent: "p"
		};

		var options = $.extend({}, defaults, options);

		var series = {};
		series.name = "All Time";
		series.values = [];
		for (var i = 0; i < data[options.dateField].length; i++) {
			var dateInt = data[options.dateField][i];
			series.values.push({
				xValue: new Date(Math.floor(data[options.dateField][i] / 100), (data[options.dateField][i] % 100) - 1, 1),
				yValue: data[options.yValue][i],
				yPercent: data[options.yPercent][i]
			});
		}
		series.values.sort(function (a, b) {
			return a.xValue - b.xValue;
		});

		return [series]; // return series wrapped in an array
	}

	function mapMonthYearDataToSeriesByYear(data, options) {
		// map data in the format yyyymm into a series for each year, and a value for each month index (1-12)
		var defaults = {
			dateField: "x",
			yValue: "y",
			yPercent: "p"
		};

		var options = $.extend({}, defaults, options);

		// this function takes month/year histogram data from Achilles and converts it into a multi-series line plot
		var series = [];
		var seriesMap = {};

		for (var i = 0; i < data[options.dateField].length; i++) {
			var targetSeries = seriesMap[Math.floor(data[options.dateField][i] / 100)];
			if (!targetSeries) {
				targetSeries = {
					name: (Math.floor(data[options.dateField][i] / 100)),
					values: []
				};
				seriesMap[targetSeries.name] = targetSeries;
				series.push(targetSeries);
			}
			targetSeries.values.push({
				xValue: data[options.dateField][i] % 100,
				yValue: data[options.yValue][i],
				yPercent: data[options.yPercent][i]
			});
		}
		series.forEach(function (d) {
			d.values.sort(function (a, b) {
				return a.xValue - b.xValue;
			});
		});
		return series;
	}

	function dataframeToArray(dataframe) {
		// dataframes from R serialize into an obect where each column is an array of values.
		var keys = d3.keys(dataframe);
		var result;
		if (dataframe[keys[0]] instanceof Array) {
			result = dataframe[keys[0]].map(function (d, i) {
				var item = {};
				var container = this;
				keys.forEach(function (p) {
					item[p] = container[p][i];
				});
				return item;
			}, dataframe);
		} else {
			result = [dataframe];
		}
		return result;
	}

	function normalizeDataframe(dataframe) {
		// rjson serializes dataframes with 1 row as single element properties.  This function ensures fields are always arrays.
		var keys = d3.keys(dataframe);
		keys.forEach(function (key) {
			if (!(dataframe[key] instanceof Array)) {
				dataframe[key] = [dataframe[key]];
			}
		});
		return dataframe;
	}

	var module = {
		mapHistogram: mapHistogram,
		mapConceptData: mapConceptData,
		mapMonthYearDataToSeries: mapMonthYearDataToSeries,
		mapMonthYearDataToSeriesByYear: mapMonthYearDataToSeriesByYear,
		dataframeToArray: dataframeToArray,
		normalizeDataframe: normalizeDataframe,
		getUrlFromDataCollection: getUrlFromDataCollection,
		getUrlFromData: getUrlFromData
	};

	return module;
});