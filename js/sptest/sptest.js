define(['knockout', 'text!./sptest.html','lodash','components/scatterplot'], function (ko, view, _) {
	function sptest(params) {
		var self = this;
		self.model = params.model;
		self.jsonFile = 'js/sptest/sample.json';
		self.chartOptions = chartOptions();
		self.dataSetup = function(vectors) {
					/* sample:
						{                               
							"covariateId": [     13,     14...
							"covariateName": [ "Age group: 1...
							"beforeMatchingMeanTreated": [ 0...
							"beforeMatchingMeanComparator": ...
							"beforeMatchingSumTreated": [ 10...
							...
							}
						*/
					var arr = [];
					var names = _.keys(vectors);
					for (var i=0; i<vectors[names[0]].length; i++) {
						var obj = {};
						names.forEach(name => obj[name] = vectors[name][i]);
						arr.push(obj);
					}
					return arr;
				};
	}

	var component = {
		viewModel: sptest,
		template: view
	};

	ko.components.register('sptest', component);
	window.nthroot = function(x, n) {
		try {
			var negate = n % 2 == 1 && x < 0;
			if(negate)
				x = -x;
			var possible = Math.pow(x, 1 / n);
			n = Math.pow(possible, n);
			if(Math.abs(x - n) < 1 && (x > 0 == n > 0))
				return negate ? -possible : possible;
		} catch(e){}
	}
	return component;
	function chartOptions() {
		var junk = 1;
		return {
			data: {
				alreadyInSeries: false,
			},
			x: {
						value: d=>d.beforeMatchingStdDiff,
						label: "Before matching StdDiff",
						tooltipOrder: 1,
			},
			y: {
						value: d=>d.afterMatchingStdDiff,
						label: "After matching StdDiff",
						format: d => {
							var str = d.toString();
							var idx = str.indexOf('.');
							if (idx == -1) {
								return d3.format('0%')(d);
							}

							var precision = (str.length - (idx+1) - 2).toString();
							return d3.format('0.' + precision + '%')(d);
						},
						tooltipOrder: 2,
			},
			size: {
						value: d=>d.afterMatchingMeanTreated,
						//scale: d3.scale.log(),
						range: [1, 8],
						label: "After matching mean treated",
						tooltipOrder: 3,
			},
			color: {
						value: function(d, i, j, props, data, series) {
							return props.series.value(d, i, j, props, data, series);
						},
						//value: d=>nthroot(d.coefficient, 7),
						//value: d=>d.coefficient,
								/*
								['NA','N/A','null','.']
									.indexOf(d.coefficient &&
													 d.coefficient.toLowerCase()
													 .trim()) > -1
									? 0 : d.coefficient || 0, // (set NA = 0)
									*/
						//label: "Coefficient",
						label: "Nonsense series",
						scale: d3.scale.ordinal(),
						domainFunc: 
							function(data, series, props, ext) {
								return _.uniq(data.map(props.series.value));
							},
						//range: ['#ef8a62','#ddd','#67a9cf'],
						range: ['red', 'green', 'pink', 'blue'],
						//domainFuncNeedsExtent: true,
						//domainFunc: (data, ext) => [ext[0], 0, ext[1]],
						/*
						rangeFunc: (layout, prop) => {
							prop.scale.rangePoints(
								['#ef8a62','#ddd','#67a9cf']);
						},
						domainFunc: (data, prop) => {
							var vals = data.map(prop.value).sort(d3.ascending);
							return vals;
							var preScale = d3.scale.ordinal()
															.domain(vals)
															.rangePoints([-1, 0, 1]);


						},
						*/
						//range: ['red', 'yellow', 'blue'],
			},
			shape: {
						//value: d => Math.floor(Math.random() * 3),
						//
						//  i as always 0! fix!
						//  value: (d,i) => i % 3,
						value: () => junk++ % 3,
						label: "Random",
						tooltipOrder: 4,
			},
			series: {
						value: d => ['A','B','C','D'][Math.floor(Math.random() * 4)],
						sortBy:  d => d.afterMatchingStdDiff,
						showOn:'color',
						tooltipOrder: 5,
			},
			CIup: { // support CI in both directions
						value: d => d.upperBound,
						value: d => y(d) - d.upperBoundDiff,
			},
			//seriesName: "recordType",
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
			],
			*/
		};
	}
});
