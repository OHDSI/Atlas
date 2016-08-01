"use strict";
define(['knockout', 'text!./scatterplot.html', 'jnj_chart'], function (ko, view, jnj_chart) {
	var _idnum = 1;
	function scatterplot(params) {
		var self = this;
		self.data = ko.observable();
		self.jsonfile = params.jsonfile;
		self.id = function() {
			return self._id = `scatter_${_idnum++}`;
		};
		console.log(`in scatterplot, loading ${self.jsonfile} for ${self._id}`);
		self.loading = ko.observable(true);
		loadData(self.jsonfile, 
						function(data) {
							console.log(data);
							var arr = flatten(data);
							var series = [{name:'all', values: arr}];
							self.loading(false);
							callScatter(self._id, series);
						});
	};

	var component = {
		viewModel: scatterplot,
		template: view
	};

	ko.components.register('scatterplot', component);
	return component;

	function loadData(jsonfile, cb) {
		var url = jsonfile;
		console.log(url);
		var request = $.ajax({
			url: url,
			method: 'GET',
			contentType: 'application/json',
			error: function (err) {
				console.log(err);
			},
			success: function (data) {
				cb(data);
			}
		});
	}
	function callScatter(divid, data) {
		var scatter = new jnj_chart.zoomScatter();
		scatter.render(data, '#'+divid, 460, 150, 
				{
					yFormat: function(d) {
						var str = d.toString();
						var idx = str.indexOf('.');
						if (idx == -1) {
							return d3.format('0%')(d);
						}

						var precision = (str.length - (idx+1) - 2).toString();
						return d3.format('0.' + precision + '%')(d);
					},
					chartProps: {
						x: {
									value: d=>d.beforeMatchingStdDiff,
									label: "Before matching StdDiff",
								},
						y: {
									value: d=>d.afterMatchingStdDiff,
									label: "After matching StdDiff",
								},
						size: {
									value: d=>d.afterMatchingMeanTreated,
									scale: d3.scale.log(),
									domain: [.5, 8],
									label: "After matching mean treated",
								},
						color: {
									value: d=>
											['NA','N/A','null','.']
												.indexOf(d.coefficient.toLowerCase().trim()) > -1
												? 0 : d.coefficient || 0, // (set NA = 0)
									label: "Coefficient",
									scale: d3.scale.linear(),
									range: ['#ef8a62','#f7f7f7','#67a9cf'],
								},
						shape: {
									value: d=>Math.floor(Math.random() * 3),
									label: "Random",
								},
					},
					//seriesName: "recordType",
					showLegend: true,
					/*
					tooltips: [
						{
							label: 'Series',
							accessor: function (o) {
								return o.recordType;
							}
						},
						{
							label: 'Percent Persons',
							accessor: function (o) {
								return d3.format('0.2%')(o.pctPersons);
							}
						},
						{
							label: 'Duration Relative to Index',
							accessor: function (o) {
								var years = Math.round(o.duration / 365);
								var days = o.duration % 365;
								var result = '';
								if (years != 0)
								result += years + 'y ';

							result += days + 'd'
							return result;
						}
					},
					{
						label: 'Person Count',
						accessor: function (o) {
							return o.countValue;
						}
					}
				]
				*/
			});
	}

	self.normalizeArray = function (ary, numerify) {
		var obj = {};
		var keys;

		if (ary && ary.length > 0 && ary instanceof Array) {
			keys = d3.keys(ary[0]);

			$.each(keys, function () {
				obj[this] = [];
			});

			$.each(ary, function () {
				var thisAryObj = this;
				$.each(keys, function () {
					var val = thisAryObj[this];
					if (numerify) {
						if (_.isFinite(+val)) {
							val = (+val);
						}
					}
					obj[this].push(val);
				});
			});
		} else {
			obj.empty = true;
		}

		return obj;
	}
	function flatten(vectors) {
		var arr = [];
		var names = _.keys(vectors);
		for (var i=0; i<vectors[names[0]].length; i++) {
			var obj = {};
			names.forEach(name => obj[name] = vectors[name][i]);
			arr.push(obj);
		}
		return arr;
	}
});
