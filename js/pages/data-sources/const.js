define(
  (require, factory) => {
    const config = require('appConfig');
    const d3 = require('d3');
    const _ = require('lodash');

    const apiPaths = {
      report: ({ sourceKey, path }) => `${config.api.url}cdmresults/${sourceKey}/${path}`,
    };

    const minChartHeight = 300;

    const mapConceptData = function (data) {
			var result;

			if (data instanceof Array) {
				result = [];
				data.forEach((item) => {
					var datum = {}
					datum.id = (+item.conceptId || item.conceptName);
					datum.label = item.conceptName;
					datum.value = +item.countValue;
					result.push(datum);
				});
			} else if (data.countValue instanceof Array) // multiple rows, each value of each column is in the indexed properties.
			{
				result = data.countValue.map(function (d, i) {
					var datum = {}
					datum.id = (d.conceptId || d.conceptName)[i];
					datum.label = d.conceptName[i];
					datum.value = d.countValue[i];
					return datum;
				});


			} else // the dataset is a single value result, so the properties are not arrays.
			{
				result = [{
					id: data.conceptId,
					label: data.conceptName,
					value: data.countValue
				}];
			}

			result = result.sort(function (a, b) {
				return b.label < a.label ? 1 : -1;
			});

			return result;
    };
    
    const normalizeArray = function (ary, numerify) {
			var obj = {};
			var keys;

			if (ary && ary.length > 0 && ary instanceof Array) {
				keys = d3.keys(ary[0]);

				keys.forEach(function (key) {
					obj[key] = [];
				});

				ary.forEach(function (item) {
					var thisAryObj = item;
					keys.forEach(function (key) {
						var val = thisAryObj[key];
						if (numerify) {
							if (_.isFinite(+val)) {
								val = (+val);
							}
						}
						obj[key].push(val);
					});
				});
			} else {
				obj.empty = true;
			}

			return obj;
    };
    
    const normalizeDataframe = function (dataframe) {
			// rjson serializes dataframes with 1 row as single element properties.  This function ensures fields are always arrays.
			var keys = d3.keys(dataframe);
			keys.forEach(function (key) {
				if (!(dataframe[key] instanceof Array)) {
					dataframe[key] = [dataframe[key]];
				}
			});
			return dataframe;
		};

    const mapHistogram = function (histogramData) {
			// result is an array of arrays, each element in the array is another array containing information about each bar of the histogram.
			var result = new Array();
			if (!histogramData.data || histogramData.data.empty) {
				return result;
			}
			var minValue = histogramData.min;
			var intervalSize = histogramData.intervalSize;

			for (var i = 0; i <= histogramData.intervals; i++) {
				var target = new Object();
				target.x = minValue + 1.0 * i * intervalSize;
				target.dx = intervalSize;
				target.y = histogramData.data.countValue[histogramData.data.intervalIndex.indexOf(i)] || 0;
				result.push(target);
			}

			return result;
		};

    const mapMonthYearDataToSeries = function (data, options) {
			var defaults = {
				dateField: "x",
				yValue: "y",
				yPercent: "p"
			};

			var options = { ...defaults, ...options };

			var series = {};
			series.name = "All Time";
			series.values = [];
			if (data && !data.empty) {
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
			}
			return [series]; // return series wrapped in an array
		};

    return {
      apiPaths,
      mapConceptData,
      mapHistogram,
      normalizeArray,
      normalizeDataframe,
      mapMonthYearDataToSeries,
      minChartHeight,
    };
  }
);