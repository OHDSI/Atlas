define(['knockout', 'text!./sptest_smoking.html','lodash','d3ChartBinding', 'components/scatterplot'], function (ko, view, _) {
	function sptest_smoking(params) {
		var self = this;
		self.model = params.model;
		self.tsvFile = 'js/sptest/smoking-lung-cancer-covariates.txt';
		self.chartOptions = chartOptions();
		self.dataSetup = d=>d;
		/* sample:
		rowid	covariateId	covariateName	analysisId	conceptId	prev.out	prev.noout	value	value	direction
		1	14	Age group: 20-24	4	0	0.004115226	0.012358883	NA	0.1	0
		2	15	Age group: 25-29	4	0	0.002057613	0.082260514	-0.403759387	0.503759387	-1
		3	16	Age group: 30-34	4	0	0.00617284	0.116181422	-0.600482689	0.700482689	-1
					label:  covariateName
					x:  prev.noout
					y:  prev.out
					size:  value
					color:  direction
					shape:  analysisid
		*/
	}

	var component = {
		viewModel: sptest_smoking,
		template: view
	};

	ko.components.register('sptest_smoking', component);
	return component;
	function chartOptions() {
		var junk = 1;
		return {
			data: {
				alreadyInSeries: false,
			},
			x: {
						value: 'prev.noout',
						label: "Prev No Out",
						tooltipOrder: 1,
			},
			y: {
						value: 'prev.out',
						label: 'Prev Out',
						tooltipOrder: 2,
			},
			size: {
						value: 'value',
						label: 'Value',
						tooltipOrder: 3,
						tooltipFunc: function(d, i, j, props, data, series, propName) {
							return {
								name: d=>covariateName,
								value: 'value',
							};
						},
			},
			color: {
						value: 'direction',
						label: "Direction",
						scale: d3.scale.category20(),
						tooltipOrder: 4,
			},
			shape: {
						value: 'analysisid',
						label: "Analysis Id",
						tooltipOrder: 5,
			},
		};
	}
});
