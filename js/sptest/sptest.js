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
		self.jsonFile = 'js/sptest/sample.json';

		self.chartObj = ko.observable();
		self.domElement = ko.observable();
		self.chartData = ko.observableArray(self.chartData && self.chartData() || []);
		self.sharedCrossfilter = ko.observable(new util.SharedCrossfilter([]));
		window.scf = self.sharedCrossfilter();
		self.chartData.subscribe(function(recs) {
			self.sharedCrossfilter().replaceData(recs);
		});
		$(self.sharedCrossfilter()).on('filter', function(evt, stuff) {
			//console.log("filter in sharedCrossfilter", stuff);
		});
		$(self.sharedCrossfilter()).on('newData', function(evt, stuff) {
			//console.log("new data in sharedCrossfilter; shouldn't happen much", stuff);
		});
		self.chartResolution = ko.observable(); // junk
		self.jqEventSpace = params.jqEventSpace || {};
		self.fields = ko.observable([]);
		self.chartObj.subscribe(function(chart) {
		});
		self.ready = ko.computed(function() {
			return  self.chartObj() && 
							self.chartData().length && 
							self.domElement() 
							//&& self.pillMode() === 'balance';
		});
		self.chartOptions = chartOptions();
		self.ready.subscribe(function(ready) {
			if (ready) {
				initializeBalanceComponents();
			}
		});
		var initializeBalanceComponents = _.once(function() {
			var opts = _.merge(self.chartObj().defaultOptions, self.chartOptions);
			var fields = _.map(opts, 
				(opt, name) => {
					if (opt.isField) {
						if (!(opt instanceof util.Field)) {
							opt = new util.Field(name, opt, opts);
						}
						opt.bindParams({data:self.chartData()}, false);
					}
					return opts[name] = opt;
				});
			self.fields(fields);
			self.chartObj().chartSetup(self.domElement(), 460, 150, opts);
			self.chartObj().render(self.chartData(), self.domElement(), 460, 150, opts);
			self.sharedCrossfilter().dimField('xy', opts.xy);
			/*  for coming back to tab
			self.pillMode.subscribe(function(pillMode) {
				if (pillMode === 'balance')
					self.chartObj().render(self.chartData(), self.domElement(), 460, 150, opts);
			});
			*/
			//self.chartOptions.xy.accessor = self.chartOptions.xy.accessors.value;
		});
		$(self.jqEventSpace).on('brush', function(evt, {empty, x1,x2,y1,y2} = {}) {
				//console.log('brush event', arguments);
				var xyFilt;
				if (empty) {
					xyFilt = null;
					util.deleteState('filters.brush');
				} else {
					xyFilt = ([x,y] = [], i) => {
																				return x >= x1 &&
																								x <= x2 &&
																								y >= y1 &&
																								y <= y2;
																			};
					util.setState('filters.brush', {x1,x2,y1,y2});
				}
				self.sharedCrossfilter().filter('xy', xyFilt, 
						{source:'brush', x1, x2, y1, y2, empty});
			});
		$(self.sharedCrossfilter()).on('filter',
			function(evt, {dimField, source, x1, x2, y1, y2, empty, waitForMore} = {}) {
				if (source === 'brush') {
					// scatter has already zoomed.
					if (empty) {
						self.chartObj().cp.x.setZoomScale();
						self.chartObj().cp.y.setZoomScale();
					} else {
						self.chartObj().cp.x.setZoomScale([x1,x2]);
						self.chartObj().cp.y.setZoomScale([y1,y2]);
					}
					self.chartObj().updateData(self.sharedCrossfilter().dimRecs('xy'));
				} else {
					if (!waitForMore || waitForMore === 'done') {
						self.chartObj().updateData(self.sharedCrossfilter().filteredRecs());
					}
				}
			});
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
			lines: [
				{
						name: 'x = .1',
						x1: () => .1,
						x2: () => .1,
						y1: (xdom, ydom) => ydom[0] * 10, // give it some extra room
						y2: (xdom, ydom) => ydom[1] * 10,
						color:'#003142',
				},
				{
						name: 'y = .1',
						y1: () => .01,
						y2: () => .01,
						x1: (xdom, ydom) => xdom[0] * 10,
						x2: (xdom, ydom) => xdom[1] * 10,
						color:'#003142',
				},
				{
						name: 'y = x',
						x1: (xdom, ydom) => Math.max(xdom[0],ydom[0]) * 10,
						y1: (xdom, ydom) => Math.max(xdom[0],ydom[0]) * 10,
						x2: (xdom, ydom) => Math.max(xdom[1],ydom[1]) * 10,
						y2: (xdom, ydom) => Math.max(xdom[1],ydom[1]) * 10,
						color:'#003142',
				},
			],
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
			xy: { // for brushing
						_accessors: {
							value: {
								func: function(d,allFields) {
									return [
													allFields.x.accessor(d),
													allFields.y.accessor(d)];
								},
								posParams: ['d','allFields'],
							},
						},
						isField: true,
			},
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
