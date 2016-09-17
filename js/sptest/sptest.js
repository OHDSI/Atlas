define(['knockout', 'text!./sptest.html','lodash','ohdsi.util','databindings/d3ChartBinding','components/faceted-datatable-cf',], 
			 function (ko, view, _, util) {
	var getData = _.once(function(self) {
		var request = $.ajax({
			url: self.jsonFile,
			method: 'GET',
			contentType: 'application/json',
			error: function (err) {
				console.log(err);
			},
			success: function (data) {
				var pdata = self.dataSetup(data);
				var chart = self.chartObj();
				//chart.render(pdata, self.domElement(), 460, 150, self.chartOptions);
				//self.chartData(pdata);
				self.chartData(pdata.slice(0,2000));
				//setTimeout(() => self.chartData(pdata.slice(0,1000)), 2000);
			}
		});
	});
	function sptest(params) {
		var self = this;
		self.model = params.model;
		var filters = {};
		self.chartObj = ko.observable();
		self.domElement = ko.observable();
		self.chartData = ko.observableArray(self.chartData && self.chartData() || []);
		self.chartResolution = ko.observable(); // junk
		self.jsonFile = 'js/sptest/sample.json';
		self.chartOptions = chartOptions();
		self.fields = ko.observable([]);
		self.jqEventSpace = params.jqEventSpace || {};
		//self.d3dispatch = ko.observable(d3.dispatch());
		self.chartObj.subscribe(function(chart) {
			var opts = _.merge(chart.defaultOptions, chartOptions());
			//var opts = chart.chartOptions; // after applying defaults

			//self.fields(_.filter(opts, d=>d.isColumn||d.isFacet));

			var fields = [];
			_.each(opts, (opt, name) => {
				if (opt.isField) {
					opts[name] = new util.Field(name, opt, opts);
					fields.push(opts[name]);
				}
			});
			self.fields(fields);
			self.chartOptions = opts;
		});
		self.ready = ko.computed(function() {
			return self.chartData().length && self.chartObj() && self.domElement();
		});
		self.ready.subscribe(function(ready) {
			if (ready) {
				self.chartObj().chartSetup(self.domElement(), 460, 150, self.chartOptions);
				self.chartObj().render(self.chartData(), self.domElement(), 460, 150, self.chartOptions);
				//self.chartObj().render(self.chartData().slice(0,1000), self.domElement(), 460, 150, self.chartOptions);
				//setTimeout(() => self.chartObj().updateData(self.chartData().slice(0,2000)), 4000);
				//self.chartObj().updateData(self.chartData().slice(0,2000));
			}
		});
		$(self.jqEventSpace).on('filter', filterChange);
		$(self.jqEventSpace).on('brush', brushEvent);
		$(self.jqEventSpace).on('filteredRecs', 
			function(evt, {source, recs} = {}) {
				if (self.chartData() && recs.length < self.chartData().length
						|| self.chartObj() && self.chartObj().latestData !== recs
					 ) {
								console.log('caught filteredRecs', recs);
								self.chartObj().render(recs, self.domElement(), 460, 150, self.chartOptions);
							}
			});
		function filterChange() {
			console.log('filter event', arguments);
			//self.chartObj().render(self.chartData(), self.domElement(), 460, 150, self.chartOptions);
		}
		function brushEvent(evt, brush, x, y) {
			console.log('brush event', arguments);
			var [[x1,y1],[x2,y2]] = brush.extent();
			var xyFilt = brush.empty() ?
				null :
				(d => {
					return x.accessors.value(d) >= x1 &&
								 x.accessors.value(d) <= x2 &&
								 y.accessors.value(d) >= y1 &&
								 x.accessors.value(d) <= y2;
				});
			util.setState('filters.brush', xyFilt);
			$(self.jqEventSpace).trigger('filter', 
								{filterName:'xy', func:xyFilt});
		}

		/*
		self.dispatch = opts.dispatch;
		self.dispatch.on("brush", function() {
			console.log(arguments);
		});
		*/
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
		/*
		self.columns = [
			{ title: 'Covariate', data: 'covariateName', },
			{ title: 'Analysis ID', data: 'analysisId', },
			{ title: 'Concept ID', data: 'conceptId', },
			{ title: 'Before Match Mean Treated', data: 'beforeMatchingMeanTreated', },
			{ title: 'Before Match Mean Comparator', data: 'beforeMatchingMeanComparator', },
		];
		self.facets = ko.observableArray([
			{ caption: 'Analysis ID', func: d=>d.analysisId, filter:ko.observable(null), Members:[] },
			{ caption: 'Concept ID', data: d=>d.conceptId, filter:ko.observable(null), Members:[] },
		]);
		*/
		getData(self);
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
	function round(num, dec) {
		return Math.round(num * Math.pow(10, dec))/Math.pow(10,dec);
	}
	function chartOptions() {
		var junk = 1;
		return {
			data: {
				alreadyInSeries: false,
			},
			//dispatch: d3.dispatch("brush", "filter"), // in default opts for zoomScatter
			//additionalDispatchEvents: ["foo"],
			x: {
						//value: d=>d.beforeMatchingStdDiff,
						label: 'Before matching StdDiff',
						tooltipOrder: 1,
						propName: 'beforeMatchingStdDiff',
						isColumn: true,
						colIdx: 1,
						isField: true,
			},
			y: {
						value: d=>d.afterMatchingStdDiff,
						label: "After matching StdDiff",
						/*
						format: d => {
							var str = d.toString();
							var idx = str.indexOf('.');
							if (idx == -1) {
								return d3.format('0%')(d);
							}

							var precision = (str.length - (idx+1) - 2).toString();
							return d3.format('0.' + precision + '%')(d);
						},
						*/
						tooltipOrder: 2,
						propName: 'afterMatchingStdDiff',
						isColumn: true,
						colIdx: 1,
						isField: true,
			},
			/*
			xy: { // for brushing
						_accessors: {
							value: {
								func: function(d,allFields) {
									return [
													allFields.accessors.x.value(d),
													allFields.accessors.y.value(d)];
								},
								posParams: ['d','allFields'],
							},
						},
						isField: true,
			},
			*/
			size: {
						//value: d=>d.afterMatchingMeanTreated,
						propName: 'afterMatchingMeanTreated',
						//scale: d3.scale.log(),
						label: "After matching mean treated",
						tooltipOrder: 3,
						/*
						tooltipFunc: function(d, i, j, props, data, series, propName) {
							var avg = d3.mean(
													data.map(props.size.value));
							return {
								name: `After matching mean treated (avg: ${round(avg,4)})`,
								value: round(props.size.value(d), 4),
							};
						},
						*/
						isField: true,
						_accessors: {
							avg: {
								posParams: ['data','allFields'],
								func: (data, allFields) => {
									return d3.mean(data.map(allFields.size.accessors.value));
								},
							},
							tooltip: {
								posParams: ['d','allFields'],
								func: (d, allFields) => {
									return {
										name: `After matching mean treated 
														(avg: ${round(allFields.size.accessors.avg(),4)})`,
										value: round(allFields.size.accessors.value(d), 4),
									}
								},
							},
							range: {
								func: () => [1,8],
							},
						},
			},
			series: {
						value: d => ['A','B','C','D'][Math.floor(Math.random() * 4)],
						sortBy:  d => d.afterMatchingStdDiff,
						tooltipOrder: 5,
						isField: true,
			},
			color: {
						_accessors: {
							value: {
												func: function(d,i,j,allFields,data,series) {
													return allFields.series.value(d,i,j,data,series);
												},
												posParams: ['d','i','j','allFields','data','series'],
							},
							domain: {
												func: function(data, series, allFields) {
													return _.uniq(data.map(allFields.series.value));
												},
												posParams: ['data', 'series', 'allFields'],
							},
							range: {
								func: () => ['red', 'green', 'pink', 'blue'],
							},
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
						//range: ['#ef8a62','#ddd','#67a9cf'],
						//range: ['red', 'green', 'pink', 'blue'],
						isField: true,
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
						isField: true,
			},
			CIup: { // support CI in both directions
						value: d => d.upperBound,
						value: d => y(d) - d.upperBoundDiff,
			},
			covariateName: {
						propName: 'covariateName',
						value: d => {
							return d.covariateName.split(/:/).shift();
						},
						isColumn: true,
						isFacet: true,
						colIdx: 0,
						tooltipOrder: 7,
						label: 'Covariate Name',
						isField: true,
			},
			covariateValue: {
						propName: 'covariateName',
						value: d => d.covariateName.split(/:/).pop(),
						isColumn: true,
						colIdx: 0,
						tooltipOrder: 8,
						label: 'Covariate Value',
						isField: true,
						/*
						_accessors: {
							tooltip: {
								posParams: ['d','allFields'],
								func: (d, allFields) => {
									return {
										name: `Covariate value`,
										value: allFields.covariateName.accessors.value(d).split(/:/).pop(),
									}
								},
							},
						},
						*/
			},
			conceptId: {
						propName: 'conceptId',
						isColumn: true,
						isFacet: true,
						colIdx: 3,
						tooltipOrder: 5,
						label: 'Concept ID',
						needsValueFunc: true, // so ChartProps will make one
																	// even though this isn't a normal
																	// zoomScatter field
						isField: true,
			},
			analysisId: {
						propName: 'analysisId',
						isColumn: true,
						isFacet: true,
						colIdx: 4,
						tooltipOrder: 6,
						label: 'Analysis ID',
						isField: true,
			},
		};
	}
});
