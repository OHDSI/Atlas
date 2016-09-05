define(['knockout', 'text!./sptest_smoking.html','lodash','d3ChartBinding', 'components/faceted-datatable-cf',], 
			 function (ko, view, _) {
	var getData = _.once(function(self) {
		var request = $.ajax({
			url: self.tsvFile,
			method: 'GET',
			contentType: 'application/json',
			error: function (err) {
				console.log(err);
			},
			success: function (tsv) {
				var chart = self.chartObj();
				var data = d3.tsv.parse(tsv);
				chart.render(data, self.domElement(), 460, 150);
				self.chartData(data);
			}
		});
	});
	function sptest_smoking(params) {
		var self = this;
		self.model = params.model;
		self.chartObj = ko.observable();
		self.tsvFile = 'js/sptest/smoking-lung-cancer-covariates.txt';
		self.chartOptions = chartOptions();
		self.domElement = ko.observable();
		self.fields = ko.observable([]);
		self.jqEventSpace = params.jqEventSpace || {};
		self.dataSetup = d=>d;
		self.chartData = ko.observableArray(self.chartData && self.chartData() || []);
		self.chartResolution = ko.observable(); // junk
		self.chartObj.subscribe(function(chart) {
			var opts = chart.chartOptions; // after applying defaults
			console.log(opts);
			self.fields(_.filter(opts, d=>d.isColumn||d.isFacet));
			//var dispatch = opts.d3dispatch;
			//self.d3dispatch(dispatch);
			//dispatch.on('filter.sptest', filterChange);
		});
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
		getData(self);
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
						value: d=>parseFloat(d['prev.noout'])||0,
							// not a good way to deal with NaNs
						propName: 'prev.noout',
						label: "Prev No Out",
						tooltipOrder: 1,
						_accessors: {
							domain: {
												func: function(allFields, data) {
													return d3.extent(data.map(allFields.x.accessors.value)
																					  .filter(d=>isFinite(d)));
												},
												posParams: ['allFields', 'data'],
							},
							range: {
								func: () => ['red', 'green', 'pink', 'blue'],
							},
						},
			},
			y: {
						propName: 'prev.out',
						value: d=>parseFloat(d['prev.out'])||0,
						label: 'Prev Out',
						tooltipOrder: 2,
			},
			size: {
						propName: 'value',
						value: d=>parseFloat(d.value)||0,
						label: 'Value',
						tooltipOrder: 3,
						_accessors: {
							range: {
								func: () => [3,8],
							},
						},
			},
			color: {
						propName: 'direction',
						value: d=>parseFloat(d.direction),
						label: "Direction",
						scale: d3.scale.category20(),
						tooltipOrder: 4,
			},
			shape: {
						propName: 'analysisid',
						label: "Analysis Id",
						tooltipOrder: 5,
			},
		};
	}
});
