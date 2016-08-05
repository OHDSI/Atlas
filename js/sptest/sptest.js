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
	return component;
	function chartOptions() {
		return {
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
									//scale: d3.scale.log(),
									//domain: [.5, 8],
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
									value: d => Math.floor(Math.random() * 3),
									label: "Random",
								},
						series: {
									groupBy: d => Math.floor(Math.random() * 3),
									sortBy:  d => d.afterMatchingStdDiff,
									showOn:'color',
								},
						CIup: { // support CI in both directions
										value: d => d.upperBound,
										value: d => y(d) - d.upperBoundDiff,
									},
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
				]
				*/
			};
	}
});
