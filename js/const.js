define(
  (require, factory) => {
    const d3 = require('d3');
    const _ = require('lodash');

		const minChartHeight = 300;
		const treemapGradient = ["#c7eaff", "#6E92A8", "#1F425A"];
		const defaultDeciles = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-99"];

    const mapConceptData = function (data) {
			var result;

			if (data instanceof Array) {
				result = [];
				data.forEach((item) => {
					var datum = {}
					datum.id = (+item.conceptId || item.conceptName);
					datum.label = item.conceptName || 'NULL (empty)';
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

		const formatPercent = d3.format('.2%');
		const formatFixed = d3.format('.2f');
		const formatComma = d3.format(',');

		const buildHierarchyFromJSON = function (data, threshold, aggProperty = { name: '', description: '' }) {
			let total = 0;

			const root = {
				"name": "root",
				"children": []
			};

			for (var i = 0; i < data.percentPersons.length; i++) {
				total += data.percentPersons[i];
			}

			for (var i = 0; i < data.conceptPath.length; i++) {
				const parts = data.conceptPath[i].split("||");
				let currentNode = root;
				for (let j = 0; j < parts.length; j++) {
					const children = currentNode.children;
					const nodeName = parts[j];
					let childNode;
					if (j + 1 < parts.length) {
						// Not yet at the end of the path; move down the tree.
						let foundChild = false;
						for (let k = 0; k < children.length; k++) {
							if (children[k].name === nodeName) {
								childNode = children[k];
								foundChild = true;
								break;
							}
						}
						// If we don't already have a child node for this branch, create it.
						if (!foundChild) {
							childNode = {
								"name": nodeName,
								"children": []
							};
							children.push(childNode);
						}
						currentNode = childNode;
					} else {
						// Reached the end of the path; create a leaf node.
						childNode = {
							"name": nodeName,
							"num_persons": data.numPersons[i],
							"concept_id": data.conceptId[i],
							"path": data.conceptPath[i],
							"percent_persons": data.percentPersons[i],
							"agg_value": data[aggProperty.name][i]
						};

						if ((data.percentPersons[i] / total) > threshold) {
							children.push(childNode);
						}
					}
				}
			}
			return root;
		}

		const filterByConcept = function(conceptId) {
      return function (d) {
        return d.conceptId === conceptId;
      };
    };

    return {
			minChartHeight,
			treemapGradient,
			defaultDeciles,

      mapConceptData,
			mapHistogram,
      mapMonthYearDataToSeries,
			
      normalizeArray,
			normalizeDataframe,			

			formatPercent,
			formatComma,
			formatFixed,
			buildHierarchyFromJSON,
			filterByConcept,
    };
  }
);